// Author: River Pearson
// UID: 115987050 
const http = require("http");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });
const express = require("express");
const app = express();
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection:process.env.MONGO_DB_COLLECTION};
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

/* API URL */
const apiUrl = "http://www.boredapi.com/api/activity/";

/* Port Number Initialization */
const portNumber = process.env.PORT ?? 5000;

/* Database and Collection */
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.ujahg0d.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

/* Template Setup */
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
process.stdin.setEncoding("utf8");

/* CSS Setup */
app.use(express.static('public'));

/* Initializes request.body with post information */ 
app.use(bodyParser.urlencoded({extended:false}));

/* Home Page */
app.get("/", (request, response) => {
	response.render("index");
});

/* Generate Activities Page */
app.get("/generateActivities", (request, response) => {
	response.render("generateActivities");
});

/* Generate Activities Confirmation Page */
app.post("/generateActivitiesConfirmation", (request, response) => {
	// Get request info
	let quantity = request.body.quantity;
    // Main function for insert
	async function main() { 
        try {
            // Wait for client to connect
			await client.connect();
            // Loop to generate activities
            for (let i = 0; i < quantity; i++) {
                // Make call to the API
                const response = await fetch(apiUrl);
                // Convert to JSON
                const activity = await response.json();
                // Wait for activity to be inserted
                await insertActivity(client, databaseAndCollection, activity);
            }
        // If error
		} catch (e) {
            // Throw error
			console.error(e);
        // Afterwards
		} finally {
			// Close client
            await client.close();
        }
    }
	// Insert Activity Function
	async function insertActivity(client, databaseAndCollection, activity) {
        const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(activity);
    }
	// Catch errors
	main().catch(console.error);
	// Variable setup
    const variables = {
        quantity: quantity
    };
	// Render
    response.render("generateActivitiesConfirmation", variables);
});

/* View Activities Page */
app.get("/viewActivities", (request, response) => {
	// Main function
	async function main() {
        try {
            // Wait for client
			await client.connect();
			// Get the activities from the database
            let result = await getActivities(client, databaseAndCollection);
            // Generate the HTML for the table
            let tableRows = "";
            result.forEach(activity => {
                tableRows += `<tr><td>${activity.activity}</td><td>${activity.accessibility}</td><td>${activity.type}</td><td>${activity.participants}</td><td>${activity.price}</td></tr>`;
            });
            // Set variables
			const variables = {
                tableRows: tableRows
            };
			// Render
            response.render("viewActivities", variables);
        } catch (e) {
			// Catch errors
            console.error(e);
        } finally {
			// Close client
            await client.close();
        }
    }
    // Function to find the activities
    async function getActivities(client, databaseAndCollection) {
        const result = await client.db(databaseAndCollection.db)
                            	   .collection(databaseAndCollection.collection)
                                   .find({});
		return result.toArray();
    }
	// Catch errors
    main().catch(console.error);
});

/* Delete Activity Page */
app.get("/deleteActivity", (request, response) => {
	// Main function
    async function main() {
        try {
			// Wait for client
            await client.connect();
			// Wait for result
            const result = await client.db(databaseAndCollection.db)
            						   .collection(databaseAndCollection.collection)
            						   .find({});
            //
            let activities = await result.toArray();
            let html = "";
	        activities.forEach(activity => {
		        html += `<option value="${activity.activity}">${activity.activity}</option>`;
	        });
            // Set variables
			const variables = {
                activities: html
            };
			// Render
            response.render("deleteActivity", variables)
        } catch (e) {
			// Catch errors
            console.error(e);
        } finally {
			// Close client
            await client.close();
        }
    }
	// Catch errors
    main().catch(console.error);
});

/* Delete Activity Confirmation Page */
app.post("/deleteActivityConfirmation", (request, response) => {
	// Get activity
    activity = request.body.activitySelect;
    // Main function
    async function main() {
        try {
			// Wait for client
            await client.connect();
			// Wait for result
            const result = await client.db(databaseAndCollection.db)
            						   .collection(databaseAndCollection.collection)
            						   .deleteOne({activity: activity});
            // Set variables
			const variables = {
                activity: activity
            };
			// Render
            response.render("deleteActivityConfirmation", variables);
        } catch (e) {
			// Catch errors
            console.error(e);
        } finally {
			// Close client
            await client.close();
        }
    }
	// Catch errors
    main().catch(console.error);
});

/* Remove All Activities Page */
app.get("/removeAllActivities", (request, response) => {
	response.render("removeAllActivities")
});

/* Remove All Activities Confirmation Page */
app.post("/removeAllActivitiesConfirmation", (request, response) => {
	// Main function
    async function main() {
        try {
			// Wait for client
            await client.connect();
			// Wait for result
            const result = await client.db(databaseAndCollection.db)
            						   .collection(databaseAndCollection.collection)
            						   .deleteMany({});
            // Set variables
			const variables = {
                quantity: result.deletedCount
            };
			// Render
            response.render("removeAllActivitiesConfirmation", variables);
        } catch (e) {
			// Catch errors
            console.error(e);
        } finally {
			// Close client
            await client.close();
        }
    }
	// Catch errors
    main().catch(console.error);
});

/* Server initialization */
app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);
process.stdout.write("Stop to shutdown the server: ");
process.stdin.setEncoding("utf8");

/* Listener/Loop */
process.stdin.on('readable', () => {  /* on equivalent to addEventListener */
	// Read from input
	let dataInput = process.stdin.read();
	// If there is input
	if (dataInput !== null) {
		// Format the command
		let command = dataInput.trim();
		// If the input is "stop"
		if (command === "stop") {
			// Shut down the server
			console.log("Shutting down the server");
            process.exit(0);  /* exiting */
		} else {
			// Notify and print the received command
			console.log(`Invalid command: ${command}`);
		}
		// Setup for next command
		process.stdout.write("Stop to shutdown the server: ");
		process.stdin.resume();
    }
});