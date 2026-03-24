import _ from "lodash"
import { getCalendarEvent, generateCalendar, generateResource } from "./utils.js";
import { getAllTournaments, getAllMatchesByTournament } from "./api.js";

const YEAR = new Date().getFullYear();

const tours = await getAllTournaments(YEAR);
//console.dir(tours);

generateResource("./resources/tournaments.json", JSON.stringify(tours));

const tourEvents = tours.map((tour) => {
    return getCalendarEvent(tour.full_name, tour.type, _.capitalize(tour.city) + ", " + tour.country, Date.parse(tour.start_date), Date.parse(tour.end_date));
});

generateCalendar(tourEvents);

const matches = [];
const matchEvents = [];
for (const tour of tours) {
    // console.debug(tour);
    const matchDays = await getAllMatchesByTournament(tour)
    //console.debug(matchDays)
    for (const matchDay of matchDays) {
        const mdAllEvents = [
            ...matchDay.main_draw,
            ...matchDay.qualify_draw,
            ...matchDay.live,
            ...matchDay.upcoming
        ].filter(Boolean);
        matches.push(...mdAllEvents);
        matchEvents.push(...mdAllEvents.map((mde) => {
            // console.debug(mde);
            const title = `${mde.tournament_name} - Day ${mde.day} - ${mde.round_name} - ${mde.team1_player_name} & ${mde.team1_partner_name} VS. ${mde.team2_player_name} & ${mde.team2_partner_player_name}`;
            console.debug(title);
            const location = _.capitalize(tour.city) + ", " + tour.country;
            console.debug(location);
            const start = `${mde.date}T${mde.start_time}:00`;

            console.debug(start);
            const startDate = new Date(start);
            const endDate = new Date(start);
            endDate.setHours(endDate.getHours() + 2);
            return getCalendarEvent(title, mde.court_name, location, startDate.getTime(), endDate.getTime());
        }));
    }
}
generateResource("./resources/matches.json", JSON.stringify(matches));

generateCalendar(matchEvents, undefined, "fip_calendar_matches");