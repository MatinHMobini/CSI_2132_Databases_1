import knex from "knex";
import creds from "./knexfile.cjs";
import express from "express";
import cors from "cors";

const db = knex(creds);
const app = express();

app.use(express.json());
app.use(cors());

app.post("/hotel", async (req, res) => {
  try {
    const { roomCapacity, price, area, hotelChain, category } = req.body;

    let filteredRooms = db("room")
        .join("hotel", "room.hotel_id", "hotel.hotel_id");

    if (roomCapacity) {
      filteredRooms = filteredRooms.where("room.capacity", "=", roomCapacity);
    }
    if (price) {
      filteredRooms = filteredRooms.where("room.price", "<=", price);
    }
    if (area) {
      filteredRooms = filteredRooms.where("hotel.address", "=", area);
    }
    if (hotelChain) {
      filteredRooms = filteredRooms
          .join("owns", "room.hotel_id", "owns.hotel_id")
          .join("hotel_chain", "owns.chain_name", "hotel_chain.chain_name")
          .where("hotel_chain.chain_name", "=", hotelChain);
    }
    if (category) {
      filteredRooms = filteredRooms.where("hotel.category", "=", category);
    }

    filteredRooms = filteredRooms.whereNull("room.booking_id")
        .select(
            "room.room_id",
            "room.capacity",
            "room.room_number",
            "room.price",
            "room.amenities",
            "room.view_type",
            "room.can_extend",
            "hotel.address as hotel_address"
        );

    const result = await filteredRooms;

    if (result.length > 0) {
      res.json(result);
    } else {
      res.json("No Matching Room IDs");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/booking", async (req, res) => {
  try {
    const { roomCapacity, price, area, hotelChain, category } = req.body;

    let filteredBookings = db("room")
        .join("hotel", "room.hotel_id", "hotel.hotel_id")
        .leftJoin("booking", "room.booking_id", "booking.booking_id"); // Left join with booking table

    if (roomCapacity) {
      filteredBookings = filteredBookings.where("room.capacity", "=", roomCapacity);
    }
    if (price) {
      filteredBookings = filteredBookings.where("room.price", "<=", price);
    }
    if (area) {
      filteredBookings = filteredBookings.where("hotel.address", "=", area);
    }
    if (hotelChain) {
      filteredBookings = filteredBookings
          .join("owns", "room.hotel_id", "owns.hotel_id")
          .join("hotel_chain", "owns.chain_name", "hotel_chain.chain_name")
          .where("hotel_chain.chain_name", "=", hotelChain);
    }
    if (category) {
      filteredBookings = filteredBookings.where("hotel.category", "=", category);
    }

    filteredBookings = filteredBookings.whereNotNull("room.booking_id") // Disregard entries where booking_id is null
        .select(
            "room.room_id",
            "room.capacity",
            "room.room_number",
            "room.price",
            "room.amenities",
            "room.view_type",
            "room.can_extend",
            "hotel.address as hotel_address",
            "booking.booking_id" // Include booking_id
        );

    const result = await filteredBookings;

    if (result.length > 0) {
      res.json(result);
    } else {
      res.json("No Matching Booking IDs");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to handle customer info
app.get("/customers", async (req, res) => {
  try {
    const customers = await db("customer").select("*");
    res.json(customers);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/update-customer/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, date } = req.body;

    // Update the customer information in the database
    await db("customer")
        .where("customer_id", "=", id)
        .update({
          customer_name: name,
          customer_address: address,
          registration_date: date,
        });

    res.json({ message: "Customer updated successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/insert-customer", async (req, res) => {
  try {
    const { id, name, address, date } = req.body;

    // Insert the new customer into the database
    await db("customer").insert({
      customer_id: id,
      customer_name: name,
      customer_address: address,
      registration_date: date,
    });

    res.status(201).json({ message: "Customer inserted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/customers/:customerId", async (req, res) => {
  try {
    const customerId = req.params.customerId;

    // Delete the customer from the database
    await db("customer").where("customer_id", customerId).del();

    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/roomsperarea", async (req, res) => {
  try {
    const roomsPerArea = await db("roomsperareafixed").select("*");
    res.json(roomsPerArea);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.listen(3000, () => {
  console.log("Server is running on port 3000");
});


//filteredRooms.select("*").then(console.log)
//db("hotel_chain").select("*").then(console.log)
