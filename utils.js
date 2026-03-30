import _ from "lodash"
import { createEvents } from "ics";
import fs from "fs";
import cityTimezones from "city-timezones";
import { fromZonedTime } from "date-fns-tz";

const YEAR = new Date().getFullYear();

const offset = 10;

const SEP = " ";
const ENDED = '[ENDED]' + SEP;
const LIVE = '[🔴LIVE]' + SEP;

export const formattedDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
};

export const getTimezoneFromTour = (tour) => {
    let result = cityTimezones.lookupViaCity(_.capitalize(tour.city));
    if (result.length) return result[0].timezone;

    const normalized = _.capitalize(_.deburr(tour.city));
    result = cityTimezones.lookupViaCity(normalized);
    if (result.length) return result[0].timezone;

    result = cityTimezones.findFromCityStateProvince(tour.country);
    if (result.length) return result[0].timezone;

    result = cityTimezones.findFromIsoCode(tour.country_code);
    if (result.length) return result[0].timezone;

    console.warn("Fallback on UTC");

    return "UTC";
}

export const convertDate = (date, timezone) => {
    return fromZonedTime(date, timezone);
}

export const getCalendarEvent = (uid, title, descr, location, start, end, created, lastModified) => {
    return {
        uid: uid,
        title: title,
        description: descr,
        location: location,
        start: start,
        end: end,
        created: created,
        lastModified: lastModified,
        startInputType: "utc",
        startOutputType: "utc",
        endInputType: "utc",
        endOutputType: "utc",
    };
}

export const generateResource = (resource_path, content) => {
    try {
        fs.writeFileSync(resource_path, content);
        console.log("Resource generated: " + resource_path);
    }
    catch (e) {
        console.error(JSON.stringify(e));
    }
}

export const generateCalendar = (events, calendar_name = "fip_calendar", calendar_title = "fip_calendar") => {
    createEvents(
        events,
        {
            calName: calendar_title,
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

export const buildScore = (team1, team2) => {
    const score = [];

    for (let i = 1; i <= 5; i++) {
        const s1 = team1[`set${i}`];
        const s2 = team2[`set${i}`];

        if (s1 == null || s2 == null) continue;

        score.push(`${s1}-${s2}`);
    }

    return score.join(" ");
}

export const buildMatchEvents = (matchDays, tour, timezone) => {
    const events = [];
    const allMatches = [];

    for (const matchDay of matchDays) {
        const allEvents = [
            ...matchDay.main_draw,
            ...matchDay.qualify_draw,
            ...matchDay.live,
            ...matchDay.upcoming
        ].filter(Boolean);

        allMatches.push(...allEvents);

        const mapped = allEvents
            .filter(m => m.is_bye === "No")
            .map(mde => {
                const isLive = matchDay.live.some(
                    m => m.tournaments_match_id === mde.tournaments_match_id
                );
                const isEnded = mde.status == "F";
                const isPlanned = mde.status == "N";
                const ended = isEnded ? ENDED : "";
                const live = isLive ? LIVE : "";

                const title = `${live}${ended}${mde.tournament_name} - ${mde.team1_player_name} & ${mde.team1_partner_name} Vs. ${mde.team2_player_name} & ${mde.team2_partner_player_name}`;

                const score = isPlanned ? "" : `Score: ${buildScore(mde.team1_score, mde.team2_score)}`;

                const descr = `Day ${mde.day} - ${mde.round_name} - ${mde.court_name}${score ? "\n" + score : ""}`;

                const location = _.capitalize(tour.city) + ", " + tour.country;
                const uid = `fip_calendar@${YEAR}§${tour.tournaments_id}#${mde.tournaments_match_id}`;
                const start = `${mde.date}T${mde.start_time}:00`;

                const start_date = convertDate(Date.parse(start), timezone);
                const end_date = new Date(start_date);
                end_date.setHours(end_date.getHours() + offset);

                const created = Date.parse(mde.created_at);
                const lastModified = Date.parse(mde.updated_at);

                return getCalendarEvent(
                    uid,
                    title,
                    descr,
                    location,
                    start_date.getTime(),
                    end_date.getTime(),
                    created,
                    lastModified
                );
            });

        events.push(...mapped);
    }

    return { events, allMatches };
    ;
}