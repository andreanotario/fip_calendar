import axios from "axios";
import FormData from "form-data";
import _ from "lodash"
import { createEvents } from "ics";
import months from "months";
import fs from "fs";

const API_MATCHES = "https://premierpadel.com/premierpadel/api/beforeauth/gettournamentsmatchlistnew";

const YEAR = 2026;

const getAllTournaments = async () => {
    const API_TOURNAMENTS = "https://premierpadel.com/premierpadel/api/beforeauth/getfanapptournaments"

    const tournaments = [];

    for (let m = 0; m < 12; m++) {
        const month = months[m];
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

const tours = await getAllTournaments();
console.dir(tours);

const events = tours.map((event) => {
    return {
        title: event.full_name,
        description: event.type,
        location: _.capitalize(event.city) + ", " + event.country,
        start: Date.parse(event.start_date),
        end: Date.parse(event.end_date),
        startInputType: "local",
        startOutputType: "local",
        endInputType: "local",
        endOutputType: "local",
    };
});


createEvents(events, {
    calName: "Premier Padel " + YEAR,
    productId: "fip_calendar"
}, (error, value) => {
    if (error) {
        console.error(error);
        return;
    }

    fs.writeFileSync("./calendar/calendar.ics", value);
    console.log("✅ Calendario generato: calendar.ics");
});