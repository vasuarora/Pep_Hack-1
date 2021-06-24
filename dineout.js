let pup=require('puppeteer');
let fs=require('fs');
let nodemailer=require('nodemailer');
let PDFDocument = require('pdfkit');
let doc = new PDFDocument({ autoFirstPage: false });

doc.pipe(fs.createWriteStream(__dirname+"\\"+"List_Of_Restaurants"+'.pdf'));

let cuisine_choice=process.argv.slice(2);
let current_location=process.argv.slice(2);

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

    await page.keyboard.type(cuisine_choice[0], { delay: 50 });

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

    let c=1;

    async function restaurant_details(restaurant_link){
        
        doc.addPage({
            margin:50
        });

        await page.goto(restaurant_link);

        await page.screenshot({path:__dirname+"\\Restaurant_Images\\"+c+".png"});

        doc.image(__dirname+"\\Restaurant_Images\\"+c+'.png', {
            width:470,
            height:300,
          });

        c++;

        await page.waitForSelector('[data-toggle="modal"]');

        await page.evaluate(function(){
            let a=document.querySelector('[data-toggle="modal"]');
            a.click('[data-toggle="modal"]');
        })

        let restaurant_name=await page.evaluate(function(){
            let a=document.querySelector(".restnt-details_info h1");
            return a.innerText;
        })

        doc.font('Times-Roman');
        doc.fontSize(16);

        doc.moveDown(1);
        doc.fillColor('black')
            .text("Restaurant Name: ",{
                underline:true,
                continued:true
            }).fillColor('#1B1464')
            .text(restaurant_name,{
                underline:false
            })

        console.log("Restaurant Name: ",restaurant_name);

        let restaurant_rating=await page.evaluate(function(){
            let a=document.querySelector(".restnt-rating.rating-5");
            return a.innerText;
        })

        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Rating (out of 5): ",{
                underline:true,
                continued:true
            }).fillColor('#1B1464')
            .text(restaurant_rating,{
                underline:false,
            })

        console.log("Rating (out of 5): ",restaurant_rating);

        let restaurant_details=await page.evaluate(function(){
            let a=document.querySelector(".restnt-cost");
            return a.innerText;
        })

        let content=restaurant_details.split("|");
        let cost=content[0];
        let cuisines=content[1];

        console.log("Cost: ",cost);
        cost=cost.slice(1);

        console.log("Cuisines: ",cuisines);

        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Cost: ",{
                underline:true,
                continued:true

            }).fillColor('#1B1464')
            .text("Rs."+cost,{
                underline:false
            })
        
        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Cuisines: ",{
                underline:true,
                continued:true
            }).fillColor('#1B1464')
            .text(cuisines,{
                underline:false
            })

        let restaurant_contact=await page.evaluate(function(){
            let a=document.querySelector('[data-event-action="Call the restaurant"] p');
            return a.innerText;
        })

        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Contact Number: ",{
                underline:true,
                continued:true
            }).fillColor('#1B1464')
            .text(restaurant_contact,{
                underline:false
            })

        console.log("Contact Number: ",restaurant_contact);

        let restaurant_timings=await page.evaluate(function(){
            let a=document.querySelector('[data-action="rdp-timings"] .text-blue.font-bold');
            return a.innerText;
        })

        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Time: ",{
                underline:true,
                continued:true
            }).fillColor('#1B1464')
            .text(restaurant_timings,{
                underline:false
            })

        console.log("Time: ",restaurant_timings);

        await page.waitForSelector('.dir-info-wrap .address p');

        let address=await page.evaluate(function(){
            let a=document.querySelector(".dir-info-wrap .address p");
            return a.innerText;
        }) 

        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Address: ",{
                underline:true,
                continued:true
            }).fillColor('#1B1464')
            .text(address,{
                underline:false
            })

        console.log("Address: ",address);

        await page.waitForSelector(".open-map.pull-right .txt-grey");

        let map_link=await page.evaluate(function(){
            let a=document.querySelector(".open-map.pull-right .txt-grey");
            let maps=a.getAttribute('href');
            return maps;
        })

        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Google Maps Link: ",{
                underline:true,
                continued:true
            }).fillColor('blue')
            .text(map_link,{
                underline:false
            })
        
        console.log("Google Maps Link:",map_link);

        await page.goto(map_link);
        await page.waitForSelector('[data-value="Directions"]');

        let restaurant_directions=await page.evaluate(function(){
            let a=document.querySelectorAll('[data-value="Directions"]')[0];
            a.click();
        })

        await page.waitForSelector('[aria-label="Choose starting point, or click on the map..."]');

        await page.type('[aria-label="Choose starting point, or click on the map..."]',current_location[1]);

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

        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Arrival Time & Distance From Home: ",{
                underline:true,
                continued:true
            }).fillColor('#1B1464')
            .text(Distance_From_Home,{
                underline:false
            })

        console.log("Arrival Time & Distance From Home: ",Distance_From_Home);

        console.log("\n");
    }

    for(let i=0;i<restaurant_link.length;i++){
        await restaurant_details(restaurant_link[i]);
    }

    doc.end();

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    let transporter=nodemailer.createTransport({
        service:'gmail',
        auth:{
            user:'bpitstudent520@gmail.com',
            pass:'bpit@123',
        }
    })

    let mailoptions={
        from:'bpitstudent520@gmail.com',
        to:'vasuarora2112@gmail.com',
        subject:'List Of Restaurants',
        text:'Below is the attached pdf of popular restaurants in your city',
        attachments:[{
            filename:'List_Of_Restaurants.pdf',
            path:__dirname+"\\List_Of_Restaurants.pdf"
        }] 
    };

    transporter.sendMail(mailoptions,function(err,data){
        if(err){
            console.log("Error Occured",err);
        }
        else{
            console.log("E-Mail Sent Successfully!!");
        }
    });

    await browser.close();
    
})();