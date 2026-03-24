import _ from "lodash"
import { getTimezoneFromTour, getCalendarEvent, generateCalendar, generateResource, convertDate } from "./utils.js";
import { getAllTournaments, getAllMatchesByTournament } from "./api.js";

const YEAR = new Date().getFullYear();

const tours = await getAllTournaments(YEAR);
//console.dir(tours);

generateResource("./resources/tournaments.json", JSON.stringify(tours));

const tourEvents = tours.map((tour) => {
    const timezone = getTimezoneFromTour(tour);
    const start_date = convertDate(Date.parse(tour.start_date), timezone);
    const end_date = convertDate(Date.parse(tour.end_date), timezone);
    return getCalendarEvent(tour.full_name, tour.type, _.capitalize(tour.city) + ", " + tour.country, start_date.getTime(), end_date.getTime());
});

generateCalendar(tourEvents);

const matches = [];
const matchEvents = [];
for (const tour of tours) {
    // console.debug(tour);
    const matchDays = await getAllMatchesByTournament(tour)

    const timezone = getTimezoneFromTour(tour);
    //console.debug(matchDays)
    for (const matchDay of matchDays) {
        const mdAllEvents = [
            ...matchDay.main_draw,
            ...matchDay.qualify_draw,
            ...matchDay.live,
            ...matchDay.upcoming
        ].filter(Boolean);
        matches.push(...mdAllEvents);
        matchEvents.push(...mdAllEvents.filter(m => m.team1_player_name != "BYE" && m.team2_player_name != "BYE" && m.team1_partner_name != "BYE" && m.team2_partner_name != "BYE").map((mde) => {
            // console.debug(mde);
            const title = `${mde.tournament_name} - Day ${mde.day} - ${mde.round_name} - ${mde.team1_player_name} & ${mde.team1_partner_name} VS. ${mde.team2_player_name} & ${mde.team2_partner_player_name}`;
            console.debug(title);
            const location = _.capitalize(tour.city) + ", " + tour.country;
            const start = `${mde.date}T${mde.start_time}:00`;

            const start_date = convertDate(Date.parse(start), timezone);
            const end_date = convertDate(Date.parse(start), timezone);
            end_date.setHours(end_date.getHours() + 2);
            return getCalendarEvent(title, mde.court_name, location, start_date.getTime(), end_date.getTime());
        }));
    }
}
generateResource("./resources/matches.json", JSON.stringify(matches));

generateCalendar(matchEvents, undefined, "fip_calendar_matches");