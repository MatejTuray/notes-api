const axios = require("axios");
const cheerio = require("cheerio");
let $, partialTesco, urlTesco;
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
require("./models/Links");
const Links = mongoose.model("links");
// KAUFLAND
const response = [];
let lidl = {};
let newLinks;
let lidlAltLink;
const scrape = () => {
  (async () => {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto("https://www.kaufland.sk/letak.html", {
      waitUntil: "networkidle2"
    });
    await page.waitForSelector(".m-teaser__link.aa-teaser-catalog");
    var HTML = await page.content();
    $ = cheerio.load(HTML);
    response.push({
      link: $(".m-teaser__link.aa-teaser-catalog")[0].attribs.href,
      name: "Kaufland",
      logo: "https://cdn.freebiesupply.com/logos/thumbs/2x/kaufland-logo.png"
    });
    scrapeDatart().then(res => {
      scrapeBilla().then(res => {
        scrapeLidl()
          .then(res => {
            newLinks = new Links({
              list: response
            });
            console.log(response);
            newLinks.save().then(resolved => console.log("saved"));
            browser.close();
          })
          .catch(e => console.log(e));
      });
    });
  })();

  // TESCO LETAK
  axios.get("https://tesco.sk/akciove-ponuky/letaky-a-katalogy/").then(res => {
    $ = cheerio.load(res.data);

    let partialTesco = $("h3[class=leaflet__title]").children()[0].attribs.href;
    let urlTesco = "https://tesco.sk" + partialTesco;
    response.push({
      link: urlTesco,
      name: "Tesco",
      logo:
        "http://ignite-images.co.uk/galleries/sy-photos/2016/06/29/18/small_21435b_tesco-logo.png"
    });
  });

  // BILLA

  const scrapeBilla = async () => {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto("https://www.billa.sk/akcie/hlavny-letak", {
      waitUntil: "networkidle2"
    });
    await page.waitForSelector("#embed-container-publitas-embed-115274");
    var HTML = await page.content();
    $ = cheerio.load(HTML);
    let partialBilla = $(
      "div[id=embed-container-publitas-embed-115274]"
    ).children()[0].attribs.src;

    response.push({
      link: "https:" + partialBilla,
      name: "Billa",
      logo:
        "http://www.mestskacast.cz/bystrc/wp-content/uploads/sites/4/2017/07/Billa_460x300px.jpg"
    });
    browser.close();
  };

  // DATART
  const scrapeDatart = async () => {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto("https://www.datart.sk/letak/index.html", {
      waitUntil: "networkidle2"
    });
    await page.waitForSelector("#content");
    var HTML = await page.content();
    $ = cheerio.load(HTML);
    let partial = $("div[id=content]").children()[0];
    let divParent = $(partial).children()[1];
    let result = $(divParent).children()[0].attribs.src;
    console.log(result);
    response.push({
      link: result,
      name: "Datart",
      logo: "http://www.mojecity.cz/UserFiles/Image/1498071116datart.png"
    });
    browser.close();
  };

  // LIDL
  const scrapeLidl = async () => {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto("https://www.lidl.sk/sk/letak.htm", {
      waitUntil: "networkidle2"
    });
    await page.waitForSelector(".leafletcontainer__content");
    var HTML = await page.content();
    $ = cheerio.load(HTML);
    let urlLidl = $(".leafletcontainer__content").children()[0].attribs.href;
    console.log($(".leafletcontainer__content").children()[0].attribs.href);
    lidlAltLink = $(".leafletcontainer__content").children()[0].attribs.href;
    console.log(urlLidl, lidlAltLink);
    lidl = {
      link: lidlAltLink,
      name: "Lidl",
      logo:
        "https://seeklogo.com/images/L/Lidl-logo-3412C5F791-seeklogo.com.png"
    };
    response.push(lidl);
    browser.close();
  };

  // COOP
  axios
    .get("https://www.coop.sk/sk/pdfflip/list")
    .then(res => {
      $ = cheerio.load(res.data);
      let partial = $("._df_thumb");

      response.push({
        link: partial[0].attribs.source,
        name: "COOP Jednota",
        logo:
          "https://upload.wikimedia.org/wikipedia/commons/b/bb/COOP_Jednota_Slovensko.png"
      });
    })
    .catch(e => console.log(e));

  //NAY
  let urlNay = "https://letaky.panoic.sk/Nay/1.html?m=1";
  response.push({
    link: urlNay,
    name: "Nay",
    logo:
      "https://www.mediahub.sk/wp-content/uploads/2016/04/stare-logo-NAY-Elektrodom.png"
  });
};

module.exports.scrape = scrape;
