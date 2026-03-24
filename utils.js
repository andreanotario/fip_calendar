import _ from "lodash"
import { createEvents } from "ics";
import fs from "fs";

export const formattedDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
};


export const getCalendarEvent = (title, descr, location, start, end) => {
    return {
        title: title,
        description: descr,
        location: location,
        start: start,
        end: end,
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

export const generateCalendar = (events, year = new Date().getFullYear(), calendar_name = "fip_calendar") => {
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