import _ from "lodash"
import { getTimezoneFromTour, getCalendarEvent, generateCalendar, generateResource, convertDate, buildMatchEvents } from "./utils.js";
import { getAllTournaments, getAllMatchesByTournament, getLiveMatches } from "./api.js";

const YEAR = new Date().getFullYear();

const tours = await getAllTournaments(YEAR);
//console.dir(tours);

generateResource("./resources/tournaments.json", JSON.stringify(tours));

const tourEvents = tours.map((tour) => {
    const timezone = getTimezoneFromTour(tour);
    const start_date = convertDate(Date.parse(tour.start_date), timezone);
    const end_date = convertDate(Date.parse(tour.end_date), timezone);
    const created = Date.parse(tour.created_at);
    const lastModified = Date.parse(tour.updated_at);
    const uid = `fip_calendar@${YEAR}§${tour.tournaments_id}`;

    return getCalendarEvent(uid, tour.full_name, tour.type, _.capitalize(tour.city) + ", " + tour.country, start_date.getTime(), end_date.getTime(), created, lastModified);
});

generateCalendar(tourEvents, "fip_calendar_tournaments", `Premier Padel - ${YEAR}`);

const matches = [];
const matchEventsMen = [];
const matchEventsWomen = [];
const matchEventsAll = [];
for (const tour of tours) {
    // console.debug(tour);
    const timezone = getTimezoneFromTour(tour);

    // const liveMatches = await getLiveMatches(tour.slug);

    const [matchDaysMen, matchDaysWomen] = await Promise.all([
        getAllMatchesByTournament(tour, "Men"),
        getAllMatchesByTournament(tour, "Women")
    ]);

    const { events: menEvents, allMatches: menMatches } =
        buildMatchEvents(matchDaysMen, tour, timezone);

    const { events: womenEvents, allMatches: womenMatches } =
        buildMatchEvents(matchDaysWomen, tour, timezone);

    matchEventsMen.push(...menEvents);
    matchEventsWomen.push(...womenEvents);
    matches.push(...menMatches, ...womenMatches);

}
matchEventsAll.push(...matchEventsMen, ...matchEventsWomen);

generateResource("./resources/matches.json", JSON.stringify(matches));

generateCalendar(matchEventsMen, "fip_calendar_matches_men", `Premier Padel - ${YEAR} - Matches Men`);
generateCalendar(matchEventsWomen, "fip_calendar_matches_women", `Premier Padel - ${YEAR} - Matches Women`);
generateCalendar(matchEventsAll, "fip_calendar_matches_all", `Premier Padel - ${YEAR} - All Matches`);