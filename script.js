// Scriptable Habit Tracker - John64
// ==============================
// =- START USER CONFIGURATION -=
// ==============================

const HABIT_NAME = "Read";
const FOLDER_NAME = "Habits";
const YEAR = 2025

const START_DATE = new Date(YEAR, 0, 1);
const END_DATE = new Date(YEAR, 11, 31);
const USER_DATE_FORMAT = 2

// Style configuration
const BG_COLOR = "#000617";
const BG_OVERLAY_OPACITY = 0.5;
const TEXT_COLOR = new Color("#FFFFFF");

// Grid colors for different states
const COLOR_TODAY = new Color("#FFFFFF");
const COLOR_FILLED = new Color("#ffb135");
const COLOR_MISSED = new Color("#002738");
const COLOR_UNFILLED = new Color("#FFFFFF", 0.2);

// Fonts and layout constants
const FONT_REGULAR = new Font("Menlo", 12);
const FONT_BOLD = new Font("Menlo-Bold", 12);

// Adjust here to change spacing and sizing
const WIDGET_WIDTH = 338;
const WIDGET_HEIGHT = 158;

const ELEMENT_SIZE = 7.5;
const ELEMENT_RADIUS = 2;
const ELEMENT_SPACING = 2.6;

// Padding around the widget
const PADDING_TOP = 8;
const PADDING_BOTTOM = 12;
const PADDING_HORIZONTAL = 6;
const PADDING_STATS_HEADER = 10; 

// ============================
// =- END USER CONFIGURATION -=
// ============================

const FILE_NAME = `${HABIT_NAME} ${YEAR}.json`;
const FM = FileManager.iCloud();
const HABITS_DIR = FM.joinPath(FM.documentsDirectory(), FOLDER_NAME);

if (!FM.fileExists(HABITS_DIR)) {
  FM.createDirectory(HABITS_DIR);
}
const FILE_PATH = FM.joinPath(HABITS_DIR, FILE_NAME);

// Function to format date based on user preference
function formatDate(date, USER_DATE_FORMAT) {
    if (USER_DATE_FORMAT === 0) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${YEAR}-${month}-${day}`;
    } else if (USER_DATE_FORMAT === 1) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}/${YEAR}`;
    } else {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}/${month}/${YEAR}`;
    }
}

// Function to get today's date key
function getTodayKey() {
  return formatDate(new Date());
}

// Functions to load and save habit data
function loadHabitData() {
  if (FM.fileExists(FILE_PATH)) {
    const raw = FM.readString(FILE_PATH);
    try {
      return JSON.parse(raw);
    } catch (e) {
      FM.writeString(FILE_PATH + ".backup", raw);
      return {};
    }
  }
  return {};
}

// Function to save habit data
function saveHabitData(data) {
  FM.writeString(FILE_PATH, JSON.stringify(data, null, 2));
}

// Function to calculate streaks
function getStreak(habitData, startDate, currentDate) {
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);

    let checkDate = new Date(startDate);
    checkDate.setHours(0, 0, 0, 0);

    while (checkDate <= today) {
    const key = formatDate(checkDate);
    const isToday = checkDate.getTime() === today.getTime();

    if (habitData[key] === true) {
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
        if (!isToday) {
        tempStreak = 0;
        }
    }
    checkDate.setDate(checkDate.getDate() + 1);
    }

    currentStreak = tempStreak;

    return {
    currentStreak: currentStreak,
    maxStreak: maxStreak
    };
}

// Main execution
if (!config.runsInWidget) {
  const data = loadHabitData();
  const today = getTodayKey();
  const alreadyLogged = data[today] === true;

  if (alreadyLogged) {
    const alert = new Alert();
    alert.title = "Already registered";
    alert.message = "Do you want to remove today's progress?";
    alert.addAction("Cancel");
    alert.addDestructiveAction("Remove");

    const response = await alert.present();
    if (response === 1) {
      data[today] = false;
      saveHabitData(data);
    }
  } else {
    data[today] = true;
    saveHabitData(data);
  }

  Script.complete();
  return;
}

const HABIT_DATA = loadHabitData();
const TODAY_KEY = getTodayKey();

const NOW = new Date();
const MS_PER_DAY = 86400000;
const DAYS_TOTAL = Math.round((END_DATE - START_DATE) / MS_PER_DAY) + 1;
const DAYS_UNTIL_END = Math.max(0, Math.round((END_DATE - NOW) / MS_PER_DAY));


if (!(TODAY_KEY in HABIT_DATA)) {
  HABIT_DATA[TODAY_KEY] = false;
  saveHabitData(HABIT_DATA);
}

// Drawing the widget
const widget = new ListWidget();
widget.setPadding(PADDING_TOP, PADDING_HORIZONTAL, PADDING_BOTTOM, PADDING_HORIZONTAL);

const overlay = new LinearGradient();
overlay.locations = [0, 1];
overlay.colors = [
  new Color(BG_COLOR, BG_OVERLAY_OPACITY),
  new Color(BG_COLOR, BG_OVERLAY_OPACITY)
];
widget.backgroundGradient = overlay;

// Stats calculation
const stats = getStreak(HABIT_DATA, START_DATE, NOW);
const DAY_INDEX_TODAY = Math.floor((NOW - START_DATE) / MS_PER_DAY) + 1;
let filledCount = 0;
for (let i = 0; i < DAY_INDEX_TODAY; i++) {
  const date = new Date(START_DATE.getTime() + i * MS_PER_DAY);
  const key = formatDate(date);
  if (HABIT_DATA[key] === true) filledCount++;
}

// Calculations for the grid layout
const TOTAL_ELEMENT_WIDTH = ELEMENT_SIZE + ELEMENT_SPACING;
const COLUMNS = Math.floor((WIDGET_WIDTH - (PADDING_HORIZONTAL * 2)) / TOTAL_ELEMENT_WIDTH);
const ROWS = Math.ceil(DAYS_TOTAL / COLUMNS);

// Header creation
const header = widget.addStack();
header.layoutHorizontally(); 
header.centerAlignContent();
header.spacing = 0;

const leftStack = header.addStack();
leftStack.layoutHorizontally();
leftStack.setPadding(0, PADDING_STATS_HEADER+7, 0, 0); 
const streakText = leftStack.addText(`${stats.currentStreak}/${stats.maxStreak}`);
streakText.font = FONT_REGULAR;
streakText.textColor = new Color(TEXT_COLOR.hex, 0.7);
leftStack.addSpacer(); 

header.addSpacer(); 
const titleText = header.addText(HABIT_NAME);
titleText.font = FONT_BOLD;
titleText.textColor = TEXT_COLOR;
header.addSpacer(); 

const rightStack = header.addStack();
rightStack.layoutHorizontally();
rightStack.setPadding(0, 0, 0, PADDING_STATS_HEADER); 
rightStack.addSpacer(); 

const progressText = rightStack.addText(`${filledCount}/${DAY_INDEX_TODAY}`);
progressText.font = FONT_REGULAR;
progressText.textColor = new Color(TEXT_COLOR.hex, 0.7);

leftStack.flexWeight = 1;
rightStack.flexWeight = 1;

widget.addSpacer();

// Grid creation
const gridContainer = widget.addStack();
gridContainer.layoutHorizontally();
gridContainer.addSpacer(); 
const gridStack = gridContainer.addStack();
gridStack.layoutVertically();
gridContainer.addSpacer(); 

gridStack.spacing = ELEMENT_SPACING;

for (let row = 0; row < ROWS; row++) {
  const rowStack = gridStack.addStack();
  rowStack.layoutHorizontally();
  rowStack.spacing = ELEMENT_SPACING;

  for (let col = 0; col < COLUMNS; col++) {
    const dayIndex = row * COLUMNS + col;

    if (dayIndex >= DAYS_TOTAL) {
       const emptySpacer = rowStack.addStack();
       emptySpacer.size = new Size(ELEMENT_SIZE, ELEMENT_SIZE);
       continue;
    }

    const dayDate = new Date(START_DATE.getTime() + dayIndex * MS_PER_DAY);
    const key = formatDate(dayDate);
    const filled = HABIT_DATA[key] === true;

    const square = rowStack.addStack();
    square.size = new Size(ELEMENT_SIZE, ELEMENT_SIZE);
    square.cornerRadius = ELEMENT_RADIUS;

    const isToday = dayDate.toDateString() === NOW.toDateString();
    
    if (filled) {
      square.backgroundColor = COLOR_FILLED;
    } else if (isToday) {
      square.backgroundColor = COLOR_TODAY;
    } else if (dayDate < new Date().setHours(0,0,0,0)) {
      square.backgroundColor = COLOR_MISSED;
    } else {
      square.backgroundColor = COLOR_UNFILLED;
    }
  }
}

Script.setWidget(widget);
Script.complete();
