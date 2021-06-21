let pup=require('puppeteer');

let fs=require('fs');
let PDFDocument = require('pdfkit');
let doc = new PDFDocument;
doc.pipe(fs.createWriteStream(__dirname+"\\"+"List Of Restaurants"+'.pdf'));

(async function(){
    let browser=await pup.launch({
        headless:false,
        slowMo:100,
        args:["--start-maximized"],
        defaultViewport:null,
    })

    let page_arr=await browser.pages();
    let page=page_arr[0];
    
    await page.goto("https://www.dineout.co.in/");

    await Promise.all([
        page.waitForNavigation(),
        page.click('[aria-label="Delhi"]')
    ])

    page.waitForSelector("#restaurantSearch");

    await Promise.all([
        page.waitForNavigation(),
        page.click('#restaurantSearch')
    ])

    await page.keyboard.type('North Indian', { delay: 50 });

    await page.waitForSelector("._2zsAT li");

    await page.evaluate(function(){
        let a=document.querySelectorAll("._2zsAT li");
        a[2].click();
    })

    await page.waitForSelector("._2QLg5");

    await Promise.all([
        page.waitForNavigation(),
        page.click('._2QLg5'),
    ])
    
    await page.waitForSelector(".do.do-angle-down",{visible:true});

    await page.evaluate(function(){
        let a = document.querySelector(".do.do-angle-down");
        a.click();
    })

    await page.waitForSelector('[data-name="Rating"]');

    await Promise.all([
        page.waitForNavigation(),
        page.click('[data-name="Rating"]'),
    ])

    await page.waitForSelector(".restnt-name.ellipsis");

    let restaurant_link=await page.evaluate(function(){
        let a=document.querySelectorAll(".restnt-name.ellipsis");
        let links=[];
        for(let i=0;i<5;i++){
            links.push("https://www.dineout.co.in/"+a[i].getAttribute('href'));
        }
        return links;
    })

    async function restaurant_details(restaurant_link){
        await page.goto(restaurant_link);

        await page.waitForSelector('[data-toggle="modal"]');

        await page.evaluate(function(){
            let a=document.querySelector('[data-toggle="modal"]');
            a.click('[data-toggle="modal"]');
        })

        let restaurant_name=await page.evaluate(function(){
            let a=document.querySelector(".restnt-details_info h1");
            return a.innerText;
        })

        await page.screenshot({path:"ss.png"});

        doc.image('./ss.png', {
            fit: [250, 300],
            align: 'center',
            valign: 'center'
        });

        doc
        .fontSize(20)
        .text(restaurant_name);

        console.log("Restaurant Name: ",restaurant_name);

        let restaurant_rating=await page.evaluate(function(){
            let a=document.querySelector(".restnt-rating.rating-5");
            return a.innerText;
        })

        doc
        .fontSize(20)
        .text(restaurant_rating);

        console.log("Rating: ",restaurant_rating);

        let restaurant_details=await page.evaluate(function(){
            let a=document.querySelector(".restnt-cost");
            return a.innerText;
        })

        let content=restaurant_details.split("|");
        let cost=content[0];
        let cuisines=content[1];

        console.log("Cost: ",cost);
        console.log("Cuisines: ",cuisines);

        doc
        .fontSize(20)
        .text(cost);

        doc
        .fontSize(20)
        .text(cuisines);

        let restaurant_contact=await page.evaluate(function(){
            let a=document.querySelector('[data-event-action="Call the restaurant"] p');
            return a.innerText;
        })

        doc
        .fontSize(20)
        .text(restaurant_contact);

        console.log("Contact Number: ",restaurant_contact);

        let restaurant_timings=await page.evaluate(function(){
            let a=document.querySelector(".restnt-details_info .timing");
            return a.innerText;
        })

        doc
        .fontSize(20)
        .text(restaurant_timings);

        console.log(restaurant_timings);

        await page.waitForSelector('.dir-info-wrap .address p');

        let address=await page.evaluate(function(){
            let a=document.querySelector(".dir-info-wrap .address p");
            return a.innerText;
        })  

        doc
        .fontSize(20)
        .text(address);

        console.log("Address: ",address);

        await page.waitForSelector(".open-map.pull-right .txt-grey");

        let map_link=await page.evaluate(function(){
            let a=document.querySelector(".open-map.pull-right .txt-grey");
            let maps=a.getAttribute('href');
            return maps;
        })

        doc
        .fontSize(20)
        .text(map_link);
        
        console.log("Google Maps Link:",map_link);

        await page.goto(map_link);
        await page.waitForSelector('[data-value="Directions"]');

        let restaurant_directions=await page.evaluate(function(){
            let a=document.querySelectorAll('[data-value="Directions"]')[0];
            a.click();
        })

        await page.waitForSelector('[aria-label="Choose starting point, or click on the map..."]');

        await page.type('[aria-label="Choose starting point, or click on the map..."]',"Model Town");

        await page.keyboard.press('Enter');

        await page.waitForSelector("#section-directions-trip-title-0");
    
        await page.evaluate(function(){
            let a=document.querySelector("#section-directions-trip-title-0");
            a.click();
        })

        await page.waitForSelector('[jsan="7.section-trip-summary-title"]',{visible:true});

        let Distance_From_Home=await page.evaluate(function(){
            let a=document.querySelector('[jsan="7.section-trip-summary-title"]');
            return a.innerText;
        })

        doc
        .fontSize(20)
        .text(Distance_From_Home);

        console.log("Distance From Home: ",Distance_From_Home);

        console.log("\n");

        doc.addPage();
    }

    for(let i=0;i<restaurant_link.length;i++){
        await restaurant_details(restaurant_link[i]);
    }

    doc.end();
    await browser.close();
    
})();