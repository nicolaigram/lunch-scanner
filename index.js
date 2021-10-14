import fetch from 'node-fetch';
import { format } from 'date-fns'
import inquirer from 'inquirer'
import chalk from 'chalk'

let startDate = new Date()

const fetchMenu = async (date, fetchBowl = false) => {
    let url = `https://wp.506.world/wp-json/trouble/post?slug=${date}`
    if (fetchBowl) url += `-lunch-bowl`
    return fetch(url, {
        "headers": {
            "accept": "application/json",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "content-type": "application/json",
            "sec-ch-ua": "\"Chromium\";v=\"94\", \"Google Chrome\";v=\"94\", \";Not A Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": "https://506.world/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "omit"
    });
}

const parseMenuRequest = async (response) => {
    try {
        const body = await response.json()
        const { menu_items } = body.acf
        return menu_items.map(o => o.menu_item && o.menu_item.text || o.menu_description && ("- " + o.menu_description) || "")
    } catch (error) {
        console.log(error)
        console.log("Error fetching")
    }
}

/**
 * 
 * @param {*} dateModifier 0 return today. 1 returns tomorrow. 2 returns the day after tomorrow.
 * @returns 
 */
const getDateString = (dateModifier = 0) => {
    const date = new Date()
    date.setDate(startDate.getDate() + dateModifier)
    return {dateString: format(date, 'MMMM-dd-yyyy').toLowerCase(), weekDay: format(date, 'EEEE')}
}

const setStartDateToMonday = (weekModifier = 0) => {
    const d = new Date();
    const day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff + 7 * weekModifier));
}

const getMenuJson = async (date, bowl = false) => {
    const request = await fetchMenu(date, bowl)
    const menu = await parseMenuRequest(request)
    if (menu.find(text => text.toLowerCase().includes(["fish cake", "fishcake"]))) {
        menu.append("🐟🎂 FISH CAKE ALERT!!!")
    }
    return menu
}

const promptWeek = () => {
    const questions = [{
        type: 'list',
        name: 'week',
        message: 'Which menu do you want?',
        choices: ['This week', 'Next week'],
        filter(val) {
            return val.toLowerCase();
        },
    },]
    return inquirer
        .prompt(questions)
        .then((answers) => {
            return answers.week === "this week" ? 0 : 1
        })
        .catch((error) => {
            console.log("Error in prompt")
            console.log(error)
        });
}

const run = async () => {
    const weekModifier = await promptWeek()
    startDate = setStartDateToMonday(weekModifier)
    const daysInAWeek = 5
    for (let i = 0; i < daysInAWeek; i++) {
        const {dateString, weekDay} = getDateString(i)
        const menuJson = await getMenuJson(dateString, false)
        const menuBowlJson = await getMenuJson(dateString, true)
        console.log(chalk.yellow(weekDay.toUpperCase() + " " + dateString))
        console.log(chalk.cyan("BUFFET"))
        console.log(menuJson)
        console.log(chalk.cyan("BOWL"))
        console.log(menuBowlJson)
    }
}

run()