import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
	const {
		username,
		email,
		password,
		preferredBrand,
		preferredVapeFlavor,
		preferredVapeLiquidAmount,
	} = req.body;

	try {
		// Check if user exists
		const [existingUsers] = await pool.query(
			"SELECT * FROM Users WHERE email = ?",
			[email],
		);
		if (existingUsers.length > 0) {
			return res.status(400).json({ message: "User already exists" });
		}

		// Hash password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create user
		const [result] = await pool.query(
			"INSERT INTO Users (user_name, email, pass, preferred_brand, preferred_vape_flavor, preferred_vape_liquid_amount, registration_date) VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE)",
			[
				username,
				email,
				hashedPassword,
				preferredBrand || null,
				preferredVapeFlavor || null,
				preferredVapeLiquidAmount || null,
			],
		);

		const userId = result.insertId;
		const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
			expiresIn: "30d",
		});

		res.status(201).json({
			id: userId,
			username,
			email,
			preferredBrand: preferredBrand || null,
			preferredVapeFlavor: preferredVapeFlavor || null,
			preferredVapeLiquidAmount: preferredVapeLiquidAmount || null,
			token,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const login = async (req, res) => {
	const { email, password } = req.body;

	try {
		// Check if user exists
		const [users] = await pool.query(
			"SELECT * FROM Users WHERE email = ?",
			[email],
		);
		if (users.length === 0) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const user = users[0];

		// Validate password
		const isMatch = await bcrypt.compare(password, user.pass);
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, {
			expiresIn: "30d",
		});

		res.json({
			id: user.user_id,
			username: user.user_name,
			email: user.email,
			preferredBrand: user.preferred_brand,
			preferredVapeFlavor: user.preferred_vape_flavor,
			preferredVapeLiquidAmount: user.preferred_vape_liquid_amount,
			token,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};
