/** 
 * author: mkmark 
 * fix www.reuters.com
 * v2
 * add cache
 * add reuters image
 * add news enclosure
 */

const cheerio = require('cheerio');

const HOME_PAGE = 'https://www.reuters.com';

module.exports = async (ctx) => {
    const section = ctx.params.section;
    const url_link = `${HOME_PAGE}/${section}`;
    const html = await ctx.cache.tryGet(
        url_link, 
        async () => {
            const browser = await require('@/utils/puppeteer')();
            const page = await browser.newPage();
            await page.goto(url_link);

            await page.setViewport({
                width: 1500,
                height: 4500
            });

            const html = await page.evaluate(() => document.documentElement.innerHTML);
            browser.close();
            return html;
        },
        15*60
    );

    const $ = cheerio.load(html);

    const list = $('li[class^=story-collection__story__]');

    ctx.state.data = {
        title: `Reuters: ${section}`,
        link: HOME_PAGE,
        description: 'Reuters News Agency',
        language: 'en',
        image: 'https://www.reuters.com/pf/resources/icons/favicon.ico',
        item: list
            .map((index, item) => {
                item = $(item);
                const title = item.find('a[class*=-story-card__]').contents().first().text();
                const link = item.find('a[class*=-story-card__]').attr('href');
                const pubDate = item.find('time').attr('datetime');
                const description_text = item.find('p[class*=-story-card__description__]').text();
                const description = description_text ? description_text : '　';
                const enclosure_url = item.find('img[class^=image__image__]').attr('src');
                const enclosure_type = 'image/jpeg';
                // console.log(enclosure_url);
                const category = item.find('span[class*=-story-card__section__]').text();

                return {
                    title,
                    description,
                    link: `${HOME_PAGE}${link}`,
                    pubDate,
                    category,
                    enclosure_url,
                    enclosure_type,
                };
            })
            .get(),
    };
};
