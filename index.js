import _ from "lodash"
import { getTimezoneFromTour, getCalendarEvent, generateCalendar, generateResource, convertDate } from "./utils.js";
import { getAllTournaments, getAllMatchesByTournament, getLiveMatches } from "./api.js";

const YEAR = new Date().getFullYear();
const offset = 12;

const tours = await getAllTournaments(YEAR);
//console.dir(tours);

generateResource("./resources/tournaments.json", JSON.stringify(tours));

const tourEvents = tours.map((tour) => {
    const timezone = getTimezoneFromTour(tour);
    const start_date = convertDate(Date.parse(tour.start_date), timezone);
    const end_date = convertDate(Date.parse(tour.end_date), timezone);
    return getCalendarEvent(tour.tournaments_id.toString(), tour.full_name, tour.type, _.capitalize(tour.city) + ", " + tour.country, start_date.getTime(), end_date.getTime());
});

generateCalendar(tourEvents, "fip_calendar_tournaments", `Premier Padel - ${YEAR}`);

const matches = [];
const matchEventsMen = [];
const matchEventsWomen = [];
const matchEventsAll = [];
for (const tour of tours) {
    // console.debug(tour);
    const timezone = getTimezoneFromTour(tour);

    const liveMatches = await getLiveMatches(tour.slug);
    const matchDaysMen = await getAllMatchesByTournament(tour, "Men");
    const matchDaysWomen = await getAllMatchesByTournament(tour, "Women");
    //console.debug(matchDays)
    for (const matchDay of matchDaysMen) {
        const mdAllEvents = [
            ...matchDay.main_draw,
            ...matchDay.qualify_draw,
            ...matchDay.live,
            ...matchDay.upcoming
        ].filter(Boolean);
        matches.push(...mdAllEvents);
        matchEventsMen.push(...mdAllEvents.filter(m => m.is_bye == "No").map((mde) => {
            // console.debug(mde);

            const live = _.find(liveMatches, { "tournaments_match_id": mde.tournaments_match_id });
            let title_live = "";
            if (live) {
                title_live = "🔴LIVE ";
            }
            const title = `${title_live}${mde.tournament_name} - ${mde.team1_player_name} & ${mde.team1_partner_name} Vs. ${mde.team2_player_name} & ${mde.team2_partner_player_name}`;
            console.debug(title);

            const descr = `Day ${mde.day} - ${mde.round_name} - ${mde.court_name}`
            const location = _.capitalize(tour.city) + ", " + tour.country;
            const uid = `${tour.tournaments_id.toString()}_${mde.tournaments_match_id.toString()}`;
            const start = `${mde.date}T${mde.start_time}:00`;

            const start_date = convertDate(Date.parse(start), timezone);
            const end_date = convertDate(Date.parse(start), timezone);
            end_date.setHours(end_date.getHours() + offset);
            return getCalendarEvent(uid, title, descr, location, start_date.getTime(), end_date.getTime());
        }));
    }
    for (const matchDay of matchDaysWomen) {
        const mdAllEvents = [
            ...matchDay.main_draw,
            ...matchDay.qualify_draw,
            ...matchDay.live,
            ...matchDay.upcoming
        ].filter(Boolean);
        matches.push(...mdAllEvents);
        matchEventsWomen.push(...mdAllEvents.filter(m => m.is_bye == "No").map((mde) => {
            const live = _.find(liveMatches, { "tournaments_match_id": mde.tournaments_match_id });
            let title_live = "";
            if (live) {
                title_live = "🔴LIVE ";
            }
            const title = `${title_live}${mde.tournament_name} - ${mde.team1_player_name} & ${mde.team1_partner_name} Vs. ${mde.team2_player_name} & ${mde.team2_partner_player_name}`;
            console.debug(title);

            const descr = `Day ${mde.day} - ${mde.round_name} - ${mde.court_name}`
            const location = _.capitalize(tour.city) + ", " + tour.country;
            const uid = `${tour.tournaments_id.toString()}_${mde.tournaments_match_id.toString()}`;
            const start = `${mde.date}T${mde.start_time}:00`;

            const start_date = convertDate(Date.parse(start), timezone);
            const end_date = convertDate(Date.parse(start), timezone);
            end_date.setHours(end_date.getHours() + offset);
            return getCalendarEvent(uid, title, descr, location, start_date.getTime(), end_date.getTime());
        }));
    }
}
matchEventsAll.push(...matchEventsMen, ...matchEventsWomen);

generateResource("./resources/matches.json", JSON.stringify(matches));

generateCalendar(matchEventsMen, "fip_calendar_matches_men", `Premier Padel - ${YEAR} - Matches Men`);
generateCalendar(matchEventsWomen, "fip_calendar_matches_women", `Premier Padel - ${YEAR} - Matches Women`);
generateCalendar(matchEventsAll, "fip_calendar_matches_all", `Premier Padel - ${YEAR} - All Matches`);