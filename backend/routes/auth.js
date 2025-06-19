const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('../generated/prisma');
const router = express.Router();

const prisma = new PrismaClient();



module.exports = router;
