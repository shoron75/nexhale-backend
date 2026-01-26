import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const getProfile = async (req, res) => {
	const userId = req.user.id;
	try {
		const [rows] = await pool.query(
			"SELECT user_id, user_name, email, preferred_brand, preferred_vape_flavor, preferred_vape_liquid_amount, registration_date FROM Users WHERE user_id = ?",
			[userId],
		);
		if (rows.length === 0)
			return res.status(404).json({ message: "User not found" });

		const user = rows[0];
		res.json({
			id: user.user_id,
			username: user.user_name,
			email: user.email,
			preferredBrand: user.preferred_brand,
			preferredVapeFlavor: user.preferred_vape_flavor,
			preferredVapeLiquidAmount: user.preferred_vape_liquid_amount,
			registrationDate: user.registration_date,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const updateProfile = async (req, res) => {
	const userId = req.user.id;
	const {
		username,
		preferredBrand,
		preferredVapeFlavor,
		preferredVapeLiquidAmount,
	} = req.body;
	try {
		await pool.query(
			"UPDATE Users SET user_name = ?, preferred_brand = ?, preferred_vape_flavor = ?, preferred_vape_liquid_amount = ? WHERE user_id = ?",
			[
				username,
				preferredBrand,
				preferredVapeFlavor,
				preferredVapeLiquidAmount,
				userId,
			],
		);
		res.json({ message: "Profile updated" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const changePassword = async (req, res) => {
	const userId = req.user.id;
	const { currentPassword, newPassword } = req.body;

	try {
		const [users] = await pool.query(
			"SELECT pass FROM Users WHERE user_id = ?",
			[userId],
		);
		const user = users[0];

		const isMatch = await bcrypt.compare(currentPassword, user.pass);
		if (!isMatch)
			return res
				.status(400)
				.json({ message: "Incorrect current password" });

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newPassword, salt);

		await pool.query("UPDATE Users SET pass = ? WHERE user_id = ?", [
			hashedPassword,
			userId,
		]);
		res.json({ message: "Password updated successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
};

export const changeEmail = async (req, res) => {
	const userId = req.user.id;
	const { newEmail, password } = req.body;

	try {
		const [users] = await pool.query(
			"SELECT pass FROM Users WHERE user_id = ?",
			[userId],
		);
		const user = users[0];

		const isMatch = await bcrypt.compare(password, user.pass);
		if (!isMatch)
			return res.status(400).json({ message: "Incorrect password" });

		await pool.query("UPDATE Users SET email = ? WHERE user_id = ?", [
			newEmail,
			userId,
		]);
		res.json({ message: "Email updated successfully" });
	} catch (error) {
		console.error(error);
		if (error.code === "ER_DUP_ENTRY")
			return res.status(400).json({ message: "Email already in use" });
		res.status(500).json({ message: "Server error" });
	}
};
