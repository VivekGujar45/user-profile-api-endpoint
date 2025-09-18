const jwt = require("jsonwebtoken");

// replace with your real MongoDB user _id
const token = jwt.sign(
  { id: "68cbdad929318cb46c17fb6f", role: "user" },
  "mysecretkey123",   // must match your middleware secret
  { expiresIn: "1h" }
);

console.log(token);
