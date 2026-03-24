import axios from "axios";
import FormData from "form-data";
import _ from "lodash"
import months from "months";
import { formattedDate } from "./utils.js";

export const getAllTournaments = async (year) => {
    const API = "https://premierpadel.com/premierpadel/api/beforeauth/getfanapptournaments"

    const tournaments = [];

    for (const month of months) {
        const form = new FormData();
        form.append("pagesize", "-1");
        form.append("year", year);
        form.append("lang", "es");
        form.append("month_name", month);

        const tours = await axios.post(API, form, {
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

export const getTournamentDates = async (slug, lang = "es") => {
    const API = "https://premierpadel.com/premierpadel/api/beforeauth/gettournamentsdate"

    const form = new FormData();
    form.append("slug", slug);
    form.append("lang", lang);

    const days = await axios.post(API, form, {
        headers: {
            ...form.getHeaders()
        }
    });

    return days.data.data;
}


export const getAllMatchesByTournament = async (tour, draw_type = "Men", lang = "es") => {
    const API = "https://premierpadel.com/premierpadel/api/beforeauth/gettournamentsmatchlistnew";

    // const start = new Date(tour.start_date);
    // const end = new Date(tour.end_date);

    const all_matches = [];

    const dates = await getTournamentDates(tour.slug, lang);

    for (const { date } of dates) {
        // const date = new Date(d);

        const form = new FormData();
        // form.append("date", formattedDate(date));
        form.append("date", date);
        form.append("tournaments_id", tour.tournaments_id);
        form.append("draw_type", draw_type);
        form.append("lang", lang);

        const matches = await axios.post(API, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        // console.dir(tours)
        all_matches.push(matches.data.data)
    }
    // console.debug("end")
    // console.dir(tournaments.flat())
    return all_matches;
}