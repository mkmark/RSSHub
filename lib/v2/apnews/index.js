/** 
 * author: mkmark 
 * modified based on mjysci's work
 * fix title not shown
 * v2
 * add cache
 * add ap news image
 * fix language
 * add news enclosure
 * fix invalid date
 * show all feeds instead of 5
 */

const cheerio = require('cheerio');

const HOME_PAGE = 'https://apnews.com';

module.exports = async (ctx) => {
    const section = ctx.params.section;
    const url_link = `${HOME_PAGE}/hub/${section}`;
    const html = await ctx.cache.tryGet(
        url_link, 
        async () => {
            const browser = await require('@/utils/puppeteer')();
            const page = await browser.newPage();
            await page.goto(url_link);

            await page.setViewport({
                width: 1600,
                height: 900
            });
            await autoScroll(page);

            const html = await page.evaluate(() => document.documentElement.innerHTML);
            browser.close();
            return html;
        },
        5*60
    );

    const $ = cheerio.load(html);

    const list = $('div.FeedCard');

    ctx.state.data = {
        title: `AP: ${section}`,
        link: HOME_PAGE,
        description: 'AP News',
        language: 'en',
        image: 'https://apnews.com/branding/favicon/256.png',
        item: list
            .map((index, item) => {
                item = $(item);
                const title = item.find('h2[class^=Component-heading-]').text();
                const link = item.find('a[class^=Component-headline-]').attr('href');
                const pubDate = item.find('span[class^=Timestamp]').attr('data-source');
                const description = item.find('div[class^=content]').text();
                const author = item.find('span[class^=Component-bylines-]').text();
                const enclosure_url = item.find('img[class^=image-]').attr('src');
                const enclosure_type = 'image/jpeg';

                return {
                    title,
                    description,
                    link: `${HOME_PAGE}${link}`,
                    pubDate,
                    author,
                    enclosure_url,
                    enclosure_type,
                };
            })
            .get(),
    };

    async function autoScroll(page){
        await page.evaluate(async () => {
            await new Promise((resolve, reject) => {
                var totalHeight = 0;
                var distance = 100;
                var timer = setInterval(() => {
                    var scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
    
                    if(totalHeight >= scrollHeight){
                        clearInterval(timer);
                        resolve();
                    }
                }, 30);
            });
        });
    }
};
