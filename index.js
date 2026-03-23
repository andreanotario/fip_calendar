import axios from "axios";
import FormData from "form-data";
import _ from "lodash"
import { createEvents } from "ics";
import months from "months";
import fs from "fs";


const YEAR = 2026;

const getAllTournaments = async () => {
    const API_TOURNAMENTS = "https://premierpadel.com/premierpadel/api/beforeauth/getfanapptournaments"

    const tournaments = [];

    for (const month of months) {
        const form = new FormData();
        form.append("pagesize", "-1");
        form.append("year", YEAR);
        form.append("lang", "es");
        form.append("month_name", month);

        const tours = await axios.post(API_TOURNAMENTS, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        // console.dir(tours)
        tournaments.push(tours.data.data)
    }
    console.log("end")
    // console.dir(tournaments.flat())
    const uniqueTournaments = _.uniqBy(_.flatten(tournaments), "tournaments_id");
    return uniqueTournaments;
}

const formattedDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
};


const getAllMatchesByTournament = async (tour, draw_type = "Men", lang = "es") => {
    const API_MATCHES = "https://premierpadel.com/premierpadel/api/beforeauth/gettournamentsmatchlistnew";

    const start = new Date(tour.start_date);
    const end = new Date(tour.end_date);

    const all_matches = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const date = new Date(d);

        const form = new FormData();
        form.append("date", formattedDate(date));
        form.append("tournaments_id", tour.tournaments_id);
        form.append("draw_type", draw_type);
        form.append("lang", lang);

        const matches = await axios.post(API_MATCHES, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        // console.dir(tours)
        all_matches.push(matches.data.data)
    }
    console.log("end")
    // console.dir(tournaments.flat())
    const uniqueMatches = _.uniqBy(_.flatten(all_matches), "matchId");
    return uniqueMatches;
}

const getCalendarEvent = (title, descr, location, start, end) => {
  return {
        title: title,
        description: descr,
        location: location,
        start: start,
        end: end,
        startInputType: "local",
        startOutputType: "local",
        endInputType: "local",
        endOutputType: "local",
    };
}

const generateResource = (resource_path, content) => {
    try {
        fs.writeFileSync(resource_path, content);
    }
    catch (e) {
        console.error(JSON.stringify(e));
    }
}



const generateCalendar = (events, year = new Date().getFullYear(), calendar_name = "fip_calendar") => {
    createEvents(
        events,
        {
            calName: "Premier Padel " + year,
            productId: calendar_name
        },
        (error, value) => {
            if (error) {
                console.error(error);
                return;
            }

            const folderpath = "./calendar/";
            const filepath = calendar_name + ".ics";
            generateResource(folderpath + filepath, value);
            console.log("✅ Calendar generated: " + filepath);
        }
    );
}

const tours = await getAllTournaments();
//console.dir(tours);

const tourEvents = tours.map((tour) => {
    return getCalendarEvent(tour.full_name, tour.type, _.capitalize(tour.city) + ", " + tour.country, Date.parse(tour.start_date), Date.parse(tour.end_date));
});



//generateCalendar(tourEvents);

const mdEvents = [];
//for (const tour of tours){
    const tour = tours[3];
    console.dir(tour);
    const matchDays = await getAllMatchesByTournament(tour)
    //console.dir(matchDays)
    for (const matchDay of matchDays) {      //mdAllEvents.push(matchDay.l)
      const mdAllEvents = [
        matchDay.main_draw,
        matchDay.qualify_draw
      ].filter(Boolean);
      mdEvents.push(mdAllEvents.map((mde) =>{
        console.log("mde");
        console.dir(mde);
        const title = `${mde.tournament_name} - Day ${mde.day} - ${mde.round_name} - ${mde.team1_player_name} & ${mde.team1_partner_name} VS. ${mde.team2_player_name} & ${mde.team2_partner_name}`;
        console.log(title);
        const location = _.capitalize(tour.city) + ", " + tour.country;
        console.log(location);
        const start = `${mde.date}T${mde.start_time}:00`;
        
        console.log(start);
       const end = start;
        //end.setHours(end.getHours() + 2);
        //return getCalendarEvent(title, mde.court_name, location, start, end);
      }));
    }
    //}
    //generateCalendar(mdEvents, undefined, "fip_calendar_matches");