require("dotenv").config();
const main = require("./main");
const express = require("express");
const cookieParser = require("cookie-parser"); // Add this line
const session = require("express-session");
const {
	checkLoggedIn,
	templateAdminHeader,
	templateAdminFooter,
	timeElapsedString,
	fetchDashboardData,
	fetchAccounts,
	con,
	getAccountById,
} = require("./main.js");
const { v4: uuidv4 } = require("uuid");
// Define the path to the configuration file

// Read the configuration data from config.js using require
const config = require("./config");
const configData = require("./config");

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const dcclient = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

dcclient.once("ready", () => {
	console.log(`Logged in as ${dcclient.user.tag}`);
	dcnotifacation("ONLINE", "ATF Tracking System");
});

function dcnotifacation(type, msg) {
	const channelId = "1150042953012740148";
	const channel = dcclient.channels.cache.get(channelId);

	if (!channel) {
		console.error("Channel not found");
		return; // Exit the function early
	}
	if (type == "ONLINE") {
		const embed = new EmbedBuilder()
			.setColor("#0BFD00") // You can set the color using a hexadecimal color code
			.setTitle("ATF TRACKING SYSTEM ONLINE");
		channel.send({ embeds: [embed] });
	}
	if (type == "ERROR") {
		const embed = new EmbedBuilder()
			.setColor("#0BFD00") // You can set the color using a hexadecimal color code
			.setTitle("ATF TRACKING SYSTEM ERROR")
			.setDescription(msg);
		channel.send({ embeds: [embed] });
	}
}

function isValidJson(jsonString) {
	try {
		JSON.parse(jsonString);
		return true;
	} catch (err) {
		return false;
	}
}

const app = express();

const port = 25565;
const fs = require("fs");
const xml2js = require("xml2js");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const { triggerAsyncId } = require("async_hooks");
const Agent = require("agentkeepalive").HttpsAgent;

const agentkeepalive = new Agent({
	timeout: 60000,
	freeSocketTimeout: 30000,
});
const request = axios.create({
	httpsAgent: agentkeepalive,
});

// Configure express-session middleware
app.use(
	session({
		secret: "oEB94QQf0qCZyfqtn7fxgSB1lVvoweUJ", // Replace with a secret key for session encryption
		resave: false,
		saveUninitialized: true,
		// You can customize other session options here
	})
);
// Set EJS as the view engine
app.set("view engine", "ejs");
app.use(express.static("assets"));

// Middleware

function smsNotifacation(msg) {
	// Twilio SMS notification code (if needed)
}

// Background script to fetch XML data and convert to JSON every 10 seconds
setInterval(() => {
	const xml2js = require("xml2js");
	const fs = require("fs");

	try {
		request
			.get(
				"http://173.199.76.125:18001/feed/dedicated-server-stats.xml?code=727abb5e6636298712ede57477209220"
			)
			.then((response) => {
				const data = response.data;

				const parser = new xml2js.Parser();
				parser.parseString(data, (err, result) => {
					const jsonData = JSON.stringify(result);
					const isValidJson = isValidJson(jsonData);

					if (isValidJson) {
						fs.writeFile("data.json", jsonData, "utf-8", (err) => {
							if (err) {
								smsNotifacation(
									"[" +
										new Date() +
										"]" +
										"(" +
										new Date().toLocaleTimeString() +
										")" +
										"Error writing JSON file: " +
										err
								);
								dcnotifacation("ERROR", err);
								console.error("Error writing JSON file:", err);
								fs.appendFile(
									"errlog.txt",
									"[" +
										new Date() +
										"]" +
										"(" +
										new Date().toLocaleTimeString() +
										")" +
										"Error writing JSON file: " +
										err,
									(appendError) => {
										if (appendError) {
											console.error(
												"Error appending to log file:",
												appendError
											);
										}
									}
								);
							} else {
								console.log("XML data successfully converted to JSON");
							}
						});
					}
				});
			});
	} catch (error) {
		console.log(
			"[" +
				new Date() +
				"]" +
				"(" +
				new Date().toLocaleTimeString() +
				")" +
				": " +
				err
		);
		smsNotifacation(
			"[" +
				new Date() +
				"]" +
				"(" +
				new Date().toLocaleTimeString() +
				")" +
				"Error with JSON file: " +
				err
		);
		dcnotifacation("ERROR", error);
		// Handle the error as needed.
	}
}, 10000); // Run every 10 seconds (10000 milliseconds)

// Route

function secondsToHoursMinutes(seconds) {
	sec = seconds * 60;
	const hours = Math.floor(sec / 3600);
	const minutes = Math.floor((sec % 3600) / 60);
	return `${hours}h ${minutes}m`;
}

app.get("/api/fetch-data-player-stats", (req, res) => {
	fs.readFile("data.json", "utf-8", (err, data) => {
		if (err) {
			console.error("Error reading JSON file:", err);
			dcnotifacation("ERROR", err);
			fs.appendFile(
				"errlog.txt",
				"[" +
					new Date() +
					"]" +
					"(" +
					new Date().toLocaleTimeString() +
					")" +
					"Error reading JSON file: " +
					err
			);
			smsNotifacation(
				"[" +
					new Date() +
					"]" +
					"(" +
					new Date().toLocaleTimeString() +
					")" +
					"Error reading JSON file: " +
					err
			);
			res.status(500).json({ error: "Error reading JSON file" });
			return;
		}

		try {
			const jsonData = JSON.parse(data);
			// Extract and filter player data as needed
			const players = jsonData.Server?.Slots?.[0]?.Player || [];

			const filteredPlayerData = players
				.filter((player) => player.$?.isUsed === "true")
				.map((player) => {
					const isInVehicle = typeof player.$?.x !== "undefined";
					return {
						name: player._,
						uptime: secondsToHoursMinutes(parseInt(player.$?.uptime)),
						isAdmin: player.$?.isAdmin,
						isInVehicle: isInVehicle,
					};
				});

			// Then send it as JSON response
			res.json({ players: filteredPlayerData });
		} catch (parseError) {
			console.error("Error parsing JSON data:", parseError);
			dcnotifacation("ERROR", parseError);
			fs.appendFile(
				"errlog.txt",
				"[" +
					new Date() +
					"]" +
					"(" +
					new Date().toLocaleTimeString() +
					")" +
					"Error parsing JSON data: " +
					parseError
			);
			smsNotifacation(
				"[" +
					new Date() +
					"]" +
					"(" +
					new Date().toLocaleTimeString() +
					")" +
					"Error parsing JSON data: " +
					parseError
			);
			res.status(500).json({ error: "Error parsing JSON data" });
		}
	});
});

app.get("/api/fetch-data-map", (req, res) => {
	fs.readFile("data.json", "utf-8", (err, data) => {
		if (err) {
			console.error("Error reading JSON file:", err);
			dcnotifacation("ERROR", err);
			fs.appendFile(
				"errlog.txt",
				"[" +
					new Date() +
					"]" +
					"(" +
					new Date().toLocaleTimeString() +
					")" +
					"Error parsing JSON data: " +
					parseError,
				(appendError) => {
					if (appendError) {
						console.error("Error appending to log file:", appendError);
					}
				}
			);

			smsNotifacation(
				"[" +
					new Date() +
					"]" +
					"(" +
					new Date().toLocaleTimeString() +
					")" +
					"Error reading JSON file: " +
					err
			);
			dcnotifacation("ERROR", err);
			res.status(500).json({ error: "Error reading JSON file" });
			return;
		}

		try {
			const jsonData = JSON.parse(data);
			const slots = jsonData.Server?.Slots?.[0] || {};
			const players = slots.Player || [];
			const vehicles = jsonData.Server?.Vehicles?.[0]?.Vehicle || [];
			const farmlands = jsonData.Server.Farmlands?.[0]?.Farmland || [];
			const fields = jsonData.Server.Fields?.[0]?.Field || [];
			const capacity = jsonData.Server?.Slots?.[0]?.$?.capacity;
			const numUsed = jsonData.Server?.Slots?.[0]?.$?.numUsed;

			// Create maps to store player positions and vehicle positions
			const playerPositionMap = {};
			const vehiclePositionMap = {};

			players.forEach((player) => {
				const name = player._;
				const x = player.$?.x;
				const y = player.$?.y;
				const z = player.$?.z;
				const isPlayerAdmin = player.$?.isAdmin;
				if (x !== undefined && y !== undefined && z !== undefined) {
					playerPositionMap[name] = { x, y, z };
				}
			});

			vehicles.forEach((vehicle) => {
				const controller = vehicle.$.controller;
				const x = vehicle.$.x;
				const y = vehicle.$.y;
				const z = vehicle.$.z;

				if (
					controller &&
					x !== undefined &&
					y !== undefined &&
					z !== undefined
				) {
					vehiclePositionMap[controller] = { x, y, z };
				}
			});

			// Prepare the data to send to the client
			const playerData = players.map((player) => {
				const name = player._;
				const isAdmin = player.$?.isAdmin;
				const position = vehiclePositionMap[name] || playerPositionMap[name];
				const uptime = secondsToHoursMinutes(parseInt(player.$?.uptime));

				return { name, position, isAdmin, uptime };
			});

			const vehicleData = vehicles.map((vehicle) => {
				const name = vehicle.$?.name.replace(".", ""); // Remove the dot from the name
				const type = vehicle.$?.type;
				const vX = vehicle.$?.x;
				const vY = vehicle.$?.y;
				const vZ = vehicle.$?.z;
				const controller = vehicle.$?.controller;
				const category = vehicle.$?.category;

				return { name, type, vX, vY, vZ, controller, category };
			});
			const farmlandData = farmlands.map((Farmland) => {
				const name = Farmland.$?.name.replace(".", ""); // Remove the dot from the name
				const id = Farmland.$?.id;
				const owner = Farmland.$?.owner;
				const area = Farmland.$?.area;
				const farmlandX = Farmland.$?.x;
				const farmlandY = Farmland.$?.y;
				const farmlandZ = Farmland.$?.z;

				return { name, id, owner, area, farmlandX, farmlandY, farmlandZ };
			});
			const fieldData = fields.map((Field) => {
				const id = Field.$?.id;
				const fieldX = Field.$?.x;
				const fieldZ = Field.$?.z;
				const isOwned = Field.$?.isOwned;

				return { id, fieldX, fieldZ, isOwned };
			});
			const slotData = {
				slotCount: capacity,
				playersOnline: numUsed,
			};

			res.json({
				players: playerData,
				vehicles: vehicleData,
				slots: slotData,
				farmlands: farmlandData,
				fields: fieldData,
			});
		} catch (parseError) {
			console.error("Error parsing JSON data:", parseError);
			dcnotifacation("ERROR", parseError);
			fs.appendFile(
				"errlog.txt",
				"[" +
					new Date() +
					"]" +
					"(" +
					new Date().toLocaleTimeString() +
					")" +
					"ATF Monitoring Server is up and running!",
				(appendError) => {
					if (appendError) {
						console.error("Error appending to log file:", appendError);
					}
				}
			);

			smsNotifacation(
				"[" +
					new Date() +
					"]" +
					"(" +
					new Date().toLocaleTimeString() +
					")" +
					"Error parsing JSON data: " +
					parseError
			);
			dcnotifacation("ERROR", parseError);
			res.status(500).json({ error: "Error parsing JSON data" });
		}
	});
});
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import your header and footer templates along with other functions

app.get("/", (req, res) => {
	res.render("login.ejs");
});

// Use the checkLoggedIn middleware for routes that require authentication
app.get("/dashboard", main.checkLoggedIn, (req, res) => {
	res.render("Map/index.ejs", { username: req.session.name });
});

// ...

// Use the checkLoggedIn middleware for routes that require authentication
app.get("/map", main.checkLoggedIn, (req, res) => {
	res.render("Map/index.ejs", { username: req.session.name });
});

app.get("/admin/account", (req, res) => {
	const accountId = req.query.id;
	const page = accountId ? "Edit" : "Create"; // Determine if it's an edit or create page
	const error_msg = req.query.error || "";
	const roles_list = ["Member", "Admin"]; // Replace with your actual list of roles

	// If accountId is provided, retrieve the account by ID
	if (accountId) {
		main.getAccountById(accountId, (err, account) => {
			if (err) {
				// Handle the error, such as rendering an error page
				res.status(500).send("An error occurred while retrieving the account.");
				return;
			}

			if (!account) {
				// If no account is found for the provided ID, handle it as needed (e.g., show a 404 page)
				res.status(404).send("Account not found.");
				return;
			}

			// Pass the retrieved account to your template
			res.render("admin/account", {
				req,
				res,
				page,
				error_msg,
				account,
				roles_list,
				templateAdminFooter,
				templateAdminHeader,
			});
		});
	} else {
		// Handle the case where no accountId is provided (e.g., for creating a new account)
		res.render("admin/account", {
			req,
			res,
			page,
			error_msg,
			account: null, // You can pass null or an empty account object for a new account
			roles_list,
			templateAdminFooter,
			templateAdminHeader,
		});
	}
});
// Function to check if username already exists
async function checkUsernameExists(username) {
	return new Promise((resolve, reject) => {
		// Query the database to check if the username exists
		const sql = "SELECT COUNT(*) AS count FROM accounts WHERE username = ?";

		con.query(sql, [username], (err, result) => {
			if (err) {
				console.error("Error checking username:", err);
				reject(err);
			} else {
				const count = result[0].count;
				resolve(count > 0); // Resolve with true if the username exists, false otherwise
			}
		});
	});
}
// Function to check if email already exists
async function checkEmailExists(email) {
	return new Promise((resolve, reject) => {
		// Query the database to check if the email exists
		const sql = "SELECT COUNT(*) AS count FROM accounts WHERE email = ?";

		con.query(sql, [email], (err, result) => {
			if (err) {
				console.error("Error checking email:", err);
				reject(err);
			} else {
				const count = result[0].count;
				resolve(count > 0); // Resolve with true if the email exists, false otherwise
			}
		});
	});
}
// Function to create a new account
async function createNewAccount(accountData) {
	return new Promise((resolve, reject) => {
		// Insert the new account data into the database
		const sql =
			"INSERT INTO accounts (username, password, email, activation_code, rememberme, role, registered, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

		con.query(
			sql,
			[
				accountData.username,
				accountData.password,
				accountData.email,
				accountData.activation_code,
				accountData.rememberme,
				accountData.role,
				accountData.registered,
				accountData.last_seen,
			],
			(err, result) => {
				if (err) {
					console.error("Error creating new account:", err);
					reject(err);
				} else {
					resolve(result.insertId); // Resolve with the ID of the newly created account
				}
			}
		);
	});
}
// Function to update an account by ID
async function updateAccountById(accountId, updatedData) {
	return new Promise((resolve, reject) => {
		// Update the account data in the database
		const sql =
			"UPDATE accounts SET username = ?, password = ?, email = ?, activation_code = ?, rememberme = ?, role = ?, registered = ?, last_seen = ? WHERE id = ?";

		con.query(
			sql,
			[
				updatedData.username,
				updatedData.password,
				updatedData.email,
				updatedData.activation_code,
				updatedData.rememberme,
				updatedData.role,
				updatedData.registered,
				updatedData.last_seen,
				accountId,
			],
			(err, result) => {
				if (err) {
					console.error("Error updating account:", err);
					reject(err);
				} else {
					resolve(result.affectedRows); // Resolve with the number of affected rows (1 if successful)
				}
			}
		);
	});
}

// Handle POST request for creating/editing an account
app.post("/admin/account", async (req, res) => {
	try {
		const {
			username,
			password,
			email,
			activation_code,
			rememberme,
			role,
			registered,
			last_seen,
		} = req.body;

		const accountId = req.query.id;

		// Check if username already exists (you'll need to implement this part)
		const existingUsername = await checkUsernameExists(username);

		if (
			existingUsername &&
			(accountId ? existingUsername.id !== accountId : true)
		) {
			return res.redirect(
				`/admin/account?error=Username already exists&id=${accountId}`
			);
		}

		// Check if email already exists (you'll need to implement this part)
		const existingEmail = await checkEmailExists(email);

		if (existingEmail && (accountId ? existingEmail.id !== accountId : true)) {
			return res.redirect(
				`/admin/account?error=Email already exists&id=${accountId}`
			);
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10);

		if (accountId) {
			// Editing an existing account
			await updateAccountById(accountId, {
				username,
				password: hashedPassword,
				email,
				activation_code,
				rememberme,
				role,
				registered,
				last_seen,
			}); // Implement this function to update the account by ID

			res.redirect("/admin/account");
		} else {
			// Creating a new account
			const newAccountId = await createNewAccount({
				username,
				password: hashedPassword,
				email,
				activation_code,
				rememberme,
				role,
				registered,
				last_seen,
			}); // Implement this function to create a new account

			res.redirect(`/admin/account?id=${newAccountId}`);
		}
	} catch (error) {
		console.error("Error creating/editing account:", error);
		return res
			.status(500)
			.send("An error occurred while creating/editing the account.");
	}
});

// Define your routes and use the imported functions and variables
app.get("/admin", (req, res) => {
	// Call fetchDashboardData to get the data
	fetchDashboardData((err, dashboardData) => {
		if (err) {
			// Handle the error, e.g., send an error response
			return res.status(500).send("Internal Server Error");
		}

		// Render the admin page with the fetched data
		res.render("admin/index", {
			req,
			res,
			dashboardData, // Pass the dashboardData object as a local variable
			templateAdminHeader,
			templateAdminFooter,
		});
	});
});

app.get("/admin/accounts", async (req, res) => {
	try {
		// Retrieve query parameters from the request
		const {
			page = 1,
			search = "",
			status = "",
			activation = "",
			role = "",
			order = "ASC",
			order_by = "id",
			results_per_page = 20,
		} = req.query;

		// Construct the URL for pagination links
		const url = `/admin/accounts?page=${page}&search=${search}&status=${status}&activation=${activation}&role=${role}&order=${order}&order_by=${order_by}`;

		// Call the fetchAccounts function from main.js to get account data
		const { accounts, accounts_total } = await fetchAccounts({
			page,
			search,
			status,
			activation,
			role,
			order,
			order_by,
			results_per_page,
		});

		// Render the HTML template (replace with your template engine)
		res.render("admin/accounts", {
			req,
			res,
			page,
			search,
			status,
			activation,
			role,
			order,
			order_by,
			results_per_page,
			accounts,
			accounts_total,
			templateAdminFooter,
			templateAdminHeader,
			url, // Pass the 'url' variable to the template
			// Add other template variables as needed
		});
	} catch (error) {
		console.error("Error fetching accounts:", error);
		// Handle errors here
		res.status(500).send("Internal Server Error");
	}
});

// Route to handle user logout
app.get("/logout", (req, res) => {
	// Destroy the session to log the user out
	req.session.destroy((err) => {
		if (err) {
			console.error("Error destroying session:", err);
			res.status(500).send("Error logging out");
		} else {
			// Clear the "rememberme" cookie if it exists
			if (req.cookies.rememberme) {
				res.clearCookie("rememberme");
			}
			// Redirect to the login page (you can change the URL as needed)
			res.redirect("/");
		}
	});
});

app.post("/authenticate", (req, res) => {
	console.log("Received POST request to /authenticate");
	console.log("Request Body:", req.body);
	// Check if the data from the login form was submitted
	if (!req.body.username || !req.body.password) {
		// Could not retrieve the captured data, send an error response
		return res
			.status(400)
			.send("Please fill both the username and password fields!");
	}

	// Prepare our SQL query and find the account associated with the login details
	// Preparing the SQL statement will prevent SQL injection
	const sql =
		"SELECT id, password, rememberme, activation_code, role, username FROM accounts WHERE username = ?";

	main.con.query(sql, [req.body.username], (err, result) => {
		if (err) {
			// Handle database error
			console.error("Database error:", err);
			return res
				.status(500)
				.send("An error occurred while processing your request.");
		}

		if (result.length > 0) {
			const { id, password, rememberme, activation_code, role, username } =
				result[0];

			// Verify the form password
			if (bcrypt.compareSync(req.body.password, password)) {
				// Check if the account is activated
				if (activation_code !== "activated") {
					// User has not activated their account, send the message
					return res.send(
						'Please activate your account to login! Click <a href="resend-activation.php">here</a> to resend the activation email.'
					);
				} else {
					// Verification success! User has logged in!
					// Declare the session variables (you can use a session library for this)
					req.session.regenerate(() => {
						req.session.loggedin = true;
						req.session.name = username;
						req.session.id = id;
						req.session.role = role;

						// IF the "remember me" checkbox is checked...
						if (req.body.rememberme !== undefined && req.body.rememberme) {
							// Generate a hash that will be stored as a cookie and in the database. It will be used to identify the user.
							const cookiehash = !empty(rememberme)
								? rememberme
								: bcrypt.hashSync(id + username + "yoursecretkey", 10);

							// The number of days the user will be remembered
							const days = 30;

							// Set the cookie
							res.cookie("rememberme", cookiehash, {
								maxAge: days * 24 * 60 * 60 * 1000,
							});

							// Update the "rememberme" field in the accounts table with the new hash
							main.con.query(
								"UPDATE accounts SET rememberme = ? WHERE id = ?",
								[cookiehash, id],
								(updateErr) => {
									if (updateErr) {
										// Handle database error
										console.error("Database error:", updateErr);
									}
								}
							);
						}

						// Update last seen date
						const date = new Date().toISOString();
						main.con.query(
							"UPDATE accounts SET last_seen = ? WHERE id = ?",
							[date, id],
							(updateErr) => {
								if (updateErr) {
									// Handle database error
									console.error("Database error:", updateErr);
								}
							}
						);

						// Send a success response
						return res.send("Success");
					});
				}
			} else {
				// Incorrect password
				return res.send("Incorrect email and/or password!");
			}
		} else {
			// Incorrect email
			return res.send("Incorrect email and/or password!");
		}
	});
});
// Handle POST request for creating an account
app.post("/createAccount", async (req, res) => {
	try {
		const { username, password, email, activation_code, rememberme, role } =
			req.body;

		// Basic input validation
		if (!username || typeof username !== "string") {
			return res.status(400).send("Invalid username.");
		}

		if (!password || typeof password !== "string" || password.length < 8) {
			return res
				.status(400)
				.send("Invalid password. Password must be at least 8 characters long.");
		}

		if (!email || typeof email !== "string") {
			return res.status(400).send("Invalid email.");
		}

		if (!activation_code || typeof activation_code !== "string") {
			return res.status(400).send("Invalid activation code.");
		}

		if (!rememberme || typeof rememberme !== "string") {
			return res.status(400).send("Invalid remember me code.");
		}

		if (!role || typeof role !== "string") {
			return res.status(400).send("Invalid role.");
		}

		// Check if username already exists
		con.query(
			"SELECT id FROM accounts WHERE username = ?",
			[username],
			(err, usernameRows) => {
				if (err) {
					console.error("Error querying username:", err);
					return res
						.status(500)
						.send("An error occurred while checking username.");
				}

				if (usernameRows.length > 0) {
					return res.status(400).send("Username already exists.");
				}

				// Check if email already exists
				con.query(
					"SELECT id FROM accounts WHERE email = ?",
					[email],
					(err, emailRows) => {
						if (err) {
							console.error("Error querying email:", err);
							return res
								.status(500)
								.send("An error occurred while checking email.");
						}

						if (emailRows.length > 0) {
							return res.status(400).send("Email already exists.");
						}

						// Hash the password and insert the new account
						bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
							if (hashErr) {
								console.error("Error hashing password:", hashErr);
								return res
									.status(500)
									.send("An error occurred while hashing the password.");
							}

							con.query(
								"INSERT INTO accounts (username, password, email, activation_code, rememberme, role) VALUES (?, ?, ?, ?, ?, ?)",
								[
									username,
									hashedPassword,
									email,
									activation_code,
									rememberme,
									role,
								],
								(insertErr) => {
									if (insertErr) {
										console.error("Error inserting account:", insertErr);
										return res
											.status(500)
											.send("An error occurred while creating the account.");
									}

									return res.status(200).send("Account created successfully!");
								}
							);
						});
					}
				);
			}
		);
	} catch (error) {
		console.error("Error creating account:", error);
		return res
			.status(500)
			.send("An error occurred while creating the account.");
	}
});

// Function to format the key
function formatKey(key) {
	key = key.replace(
		/_|url|db | pass| user| id| uri|oauth|recaptcha/gi,
		(match) => {
			const replacements = {
				_: " ",
				url: "URL",
				"db ": "Database ",
				" pass": " Password",
				" user": " Username",
				" id": " ID",
				" uri": " URI",
				oauth: "OAuth",
				recaptcha: "reCAPTCHA",
			};
			return replacements[match.toLowerCase()] || match;
		}
	);
	return key.charAt(0).toUpperCase() + key.slice(1); // Uppercase the first letter
}

function generateLabelsAndCaptions(config) {
	const result = {};

	config.tabs.forEach((tab) => {
		const tabName = tab.name;
		tab.sections.forEach((section) => {
			section.keys.forEach((keyObj) => {
				const { key, caption, value } = keyObj;
				const userFriendlyLabel = formatKey(key);

				// Include tabName and section.header in the fieldKey for uniqueness
				const fieldKey = `${tabName}-${section.header}-${key}`;

				result[fieldKey] = {
					label: `${section.header} - ${userFriendlyLabel}`,
					caption: caption,
					key: key,
					value: value,
				};

				// Add debug logging
				console.log(`Generated fieldKey: ${fieldKey}`);
			});
		});
	});

	return result;
}
// Generate labels and captions
const labelsAndComments = generateLabelsAndCaptions(config);

const successMsg = "Settings updated successfully!"; // Initialize it with an appropriate message

app.get("/admin/settings", (req, res) => {
	const selectedTab = req.query.tab || "General";

	try {
		const configData = require("./config"); // Make sure 'config.js' is in the same directory as this script

		const tabs = configData.tabs.map((tab) => {
			const sections = tab.sections.map((section) => {
				const keys = section.keys.map((keyObj) => {
					const { key, label, caption, value } = keyObj;
					return {
						key,
						label,
						caption,
						value,
					};
				});

				return {
					key: section.key,
					keys,
				};
			});

			return {
				name: tab.name,
				sections,
			};
		});

		// Ensure that tabs is properly structured with sections and keys data
		console.log("Tabs data:", tabs);

		res.render("admin/settings", {
			selectedTab: selectedTab,
			tabs: tabs, // Pass the tabs array to the template
			fields: configData.fields, // Pass the fields data directly to the template
			config: config,
			successMsg: successMsg,
			templateAdminHeader: templateAdminHeader,
			templateAdminFooter: templateAdminFooter,
			req: req,
		});
	} catch (error) {
		console.error("Error reading config file:", error);
		return res.status(500).send("Error reading config file");
	}
});

// Start the server
app.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
	smsNotifacation(
		"[" +
			new Date() +
			"]" +
			"(" +
			new Date().toLocaleTimeString() +
			")" +
			"ATF Monitoring Server is up and running!"
	);
	dcclient.login(process.env.BOT_TOKEN);
});
