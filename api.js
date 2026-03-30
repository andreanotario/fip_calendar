import axios from "axios";
import axiosRetry from 'axios-retry';
import FormData from "form-data";
import _ from "lodash"
import months from "months";

export const fip_api = axios.create({
    baseURL: "https://premierpadel.com/premierpadel/api/beforeauth/"
});

axiosRetry(fip_api, {
    retries: 3,
    retryDelay: retryCount => retryCount * 500
});

export const getAllTournaments = async (year) => {
    const uri = "/getfanapptournaments";

    const tournaments = [];

    for (const month of months) {
        const form = new FormData();
        form.append("pagesize", "-1");
        form.append("year", year);
        form.append("lang", "es");
        form.append("month_name", month);

        const tours = await fip_api.post(uri, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        // console.dir(tours)
        tournaments.push(tours.data.data)
    }
    // console.debug("end")
    // console.dir(tournaments.flat())
    const uniqueTournaments = _.uniqBy(_.flatten(tournaments), "tournaments_id");
    return uniqueTournaments;
}

export const getTournamentDates = async (slug, lang = "es") => {
    const uri = "/gettournamentsdate"

    const form = new FormData();
    form.append("slug", slug);
    form.append("lang", lang);

    const days = await fip_api.post(uri, form, {
        headers: {
            ...form.getHeaders()
        }
    });

    return days.data.data;
}


export const getAllMatchesByTournament = async (tour, draw_type = "Men", lang = "es") => {
    const uri = "/gettournamentsmatchlistnew";

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

        const matches = await fip_api.post(uri, form, {
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

export const getLiveMatches = async (slug) => {
    const uri = "/gettournamentslivematch";

    const form = new FormData();
    form.append("slug", slug);

    const matches = await fip_api.post(uri, form, {
        headers: {
            ...form.getHeaders()
        }
    });

    return matches.data.data;
}