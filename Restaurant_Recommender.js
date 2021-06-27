let pup=require('puppeteer');
let fs=require('fs');
let nodemailer=require('nodemailer');
let PDFDocument = require('pdfkit');
let doc = new PDFDocument({ autoFirstPage: false });

doc.pipe(fs.createWriteStream(__dirname+"\\"+"List_Of_Restaurants"+'.pdf'));          //creation of pdf in the given path

let cuisine_choice=process.argv.slice(2);               //input for cuisine choice
let current_location=process.argv.slice(2);             //input for user's current location

(async function(){
    let browser=await pup.launch({
        headless:false,
        slowMo:100,
        args:["--start-maximized"],
        defaultViewport:null,
    })

    let page_arr=await browser.pages();
    let page=page_arr[0];                                         //new browser page
    
    await page.goto("https://www.dineout.co.in/");                //navigating to the dineout website              

    await Promise.all([
        page.waitForNavigation(),
        page.click('[aria-label="Delhi"]')                      //Selecting the city as Delhi
    ])

    page.waitForSelector("#restaurantSearch");

    await Promise.all([
        page.waitForNavigation(),
        page.click('#restaurantSearch')                                   
    ])

    await page.keyboard.type(cuisine_choice[0], { delay: 50 });                //Typing the cuisine name in search box

    await page.waitForSelector("._2zsAT li");

    await page.evaluate(function(){
        let a=document.querySelectorAll("._2zsAT li");                         
        a[2].click();                                                //clicking on 'search by cuisine' option
    })

    await page.waitForSelector("._2QLg5");

    await Promise.all([
        page.waitForNavigation(),
        page.click('._2QLg5'),                                //clicking on the search button
    ])
    
    await page.waitForSelector(".do.do-angle-down",{visible:true});

    await page.evaluate(function(){
        let a = document.querySelector(".do.do-angle-down");
        a.click();
    })

    await page.waitForSelector('[data-name="Rating"]');

    await Promise.all([
        page.waitForNavigation(),
        page.click('[data-name="Rating"]'),                        //Selecting 'Sort by' as rating
    ])

    await page.waitForSelector(".restnt-name.ellipsis");

    let restaurant_link=await page.evaluate(function(){
        let a=document.querySelectorAll(".restnt-name.ellipsis");
        let links=[];
        for(let i=0;i<5;i++){
            links.push("https://www.dineout.co.in/"+a[i].getAttribute('href'));           //storing the top 5 restaurant links in array
        }
        return links;
    })

    let c=1;                         //Using this variable as different names to screenshot image

    async function restaurant_details(restaurant_link){
        
        doc.addPage({
            margin:50
        });

        await page.goto(restaurant_link);                           //navigating to a particular restaurant page

        await page.screenshot({path:__dirname+"\\Restaurant_Images\\"+c+".png"});                //taking the screenshot and storing it in the given path

        doc.image(__dirname+"\\Restaurant_Images\\"+c+'.png', {                     //storing the screenshot image in pdf
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
            let a=document.querySelector(".restnt-details_info h1");                //fetching restaurant's name
            return a.innerText;
        })

        doc.font('Times-Roman');                 //font style of text in pdf
        doc.fontSize(16);                        //font size of text in pdf

        doc.moveDown(1);
        doc.fillColor('black')                             //storing restaurant's name in pdf
            .text("Restaurant Name: ",{
                underline:true,
                continued:true
            }).fillColor('#1B1464')
            .text(restaurant_name,{
                underline:false
            })

        console.log("Restaurant Name: ",restaurant_name);

        let restaurant_rating=await page.evaluate(function(){
            let a=document.querySelector(".restnt-rating.rating-5");                  //fetching restaurant's rating
            return a.innerText;
        })

        doc.moveDown(0.7);
        doc.fillColor('black')                                           //storing restaurant's rating in pdf
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
        let cost=content[0];                                   //fetching restaurant's approximate dine in price
        let cuisines=content[1];                               //fetching the cuisines available in restaurant

        console.log("Cost: ",cost);
        cost=cost.slice(1);

        console.log("Cuisines: ",cuisines);

        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Cost: ",{                                //storing the dine in price in pdf
                underline:true,
                continued:true

            }).fillColor('#1B1464')
            .text("Rs."+cost,{
                underline:false
            })                                                  
        
        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Cuisines: ",{                       //storing the cuisines in pdf
                underline:true,
                continued:true
            }).fillColor('#1B1464')
            .text(cuisines,{
                underline:false
            })

        let restaurant_contact=await page.evaluate(function(){
            let a=document.querySelector('[data-event-action="Call the restaurant"] p');
            return a.innerText;                                                             //fetching restaurant's contact details
        })

        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Contact Number: ",{                                     //storing the contact details in pdf
                underline:true,
                continued:true
            }).fillColor('#1B1464')
            .text(restaurant_contact,{
                underline:false                                 
            })

        console.log("Contact Number: ",restaurant_contact);

        let restaurant_timings=await page.evaluate(function(){
            let a=document.querySelector('[data-action="rdp-timings"] .text-blue.font-bold');
            return a.innerText;                                                                 //fetching the timings of restaurant
        })

        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Time: ",{                                   //storing the timings in pdf
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
            return a.innerText;                                          //fetching the restaurant address
        }) 

        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Address: ",{                           //storing the address in pdf
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
            let maps=a.getAttribute('href');                                       //fetching the google map link
            return maps;
        })

        doc.moveDown(0.7);
        doc.fillColor('black')
            .text("Google Maps Link: ",{                         //storing the google map link in pdf
                underline:true,
                continued:true
            }).fillColor('blue')
            .text(map_link,{
                underline:false
            })
        
        console.log("Google Maps Link:",map_link);

        await page.goto(map_link);
        await page.waitForSelector('[data-value="Directions"]');

        //fetching the distance and time of arrival from user's given location via google maps
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
            .text("Arrival Time & Distance From Home: ",{                   //storing the distance and time of arrival in pdf
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

    let transporter=nodemailer.createTransport({                     //email id configuration
        service:'gmail',
        auth:{
            user:'bpitstudent520@gmail.com',
            pass:'bpit@123',
        }
    })

    let mailoptions={
        from:'bpitstudent520@gmail.com',                                                   //sender's email address 
        to:'vasuarora2112@gmail.com',                                                      //receiver's email address
        subject:'List Of Restaurants',                                                    //subject of email
        text:'Below is the attached pdf of restaurant details of your favourite cuisine',
        attachments:[{
            filename:'List_Of_Restaurants.pdf',                                     //attaching the 'restaurant details' pdf in email
            path:__dirname+"\\List_Of_Restaurants.pdf"
        }] 
    };

    transporter.sendMail(mailoptions,function(err,data){                       //sending the email
        if(err){
            console.log("Error Occured",err);
        }
        else{
            console.log("E-Mail Sent Successfully!!");
        }
    });

    await browser.close();
    
})();