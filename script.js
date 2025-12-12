// Scriptable Habit Tracker - John64

// ========================
// =- USER CONFIGURATION -=
// ========================

const HABIT_NAME = "Read";
const START_DATE = new Date(2025, 0, 1);
const END_DATE = new Date(2025, 11, 31);

const BG_COLOR = "#000617";
const BG_OVERLAY_OPACITY = 0.5;

const TEXT_COLOR = new Color("#FFFFFF");
const COLOR_TODAY = new Color("#FFFFFF");
const COLOR_FILLED = new Color("#ffb135");
const COLOR_MISSED = new Color("#002738");
const COLOR_UNFILLED = new Color("#FFFFFF", 0.2);

const PADDING = 3;
const CIRCLE_SIZE = 6;
const CIRCLE_SPACING = 3;
const TEXT_SPACING = 7;
const MARGIN_ADJUSTMENT = 12;

const FONT_REGULAR = new Font("Menlo", 12);
const FONT_BOLD = new Font("Menlo-Bold", 12);

// ======================
// =- ADVANCED OPTIONS -=
// ======================

const FILE_NAME = `${HABIT_NAME}.json`;
const FM = FileManager.iCloud();
const HABITS_DIR = FM.joinPath(FM.documentsDirectory(), "Habits");
if (!FM.fileExists(HABITS_DIR)) {
  FM.createDirectory(HABITS_DIR);
}
const FILE_PATH = FM.joinPath(HABITS_DIR, FILE_NAME);

function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function getTodayKey() {
  return formatDate(new Date());
}

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

function saveHabitData(data) {
  FM.writeString(FILE_PATH, JSON.stringify(data, null, 2));
}

function calculateStreak(habitData, startDate, currentDate) {
  let streak = 0;
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  let checkDate = new Date(today);
  const MS_PER_DAY = 86400000;

  while (checkDate >= startDate) {
    const key = formatDate(checkDate);
    if (habitData[key] === true) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function calculateMaxStreak(habitData, startDate, endDate) {
  let maxStreak = 0;
  let currentStreak = 0;

  const MS_PER_DAY = 86400000;
  const totalDays = Math.round((endDate - startDate) / MS_PER_DAY);

  for (let i = 0; i <= totalDays; i++) {
    const date = new Date(startDate.getTime() + i * MS_PER_DAY);
    const key = formatDate(date);

    if (habitData[key] === true) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

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

// ======================
// =- WIDGET MODE -=
// ======================

const NOW = new Date();
const MS_PER_DAY = 86400000;

const DAYS_TOTAL = Math.round((END_DATE - START_DATE) / MS_PER_DAY) + 1;
const DAYS_UNTIL_END = Math.max(0, Math.round((END_DATE - NOW) / MS_PER_DAY));

const habitData = loadHabitData();
const todayKey = getTodayKey();

if (!(todayKey in habitData)) {
  habitData[todayKey] = false;
  saveHabitData(habitData);
}

const widget = new ListWidget();
const overlay = new LinearGradient();
overlay.locations = [0, 1];
overlay.colors = [
  new Color(BG_COLOR, BG_OVERLAY_OPACITY),
  new Color(BG_COLOR, BG_OVERLAY_OPACITY)
];
widget.backgroundGradient = overlay;

const WIDGET_WIDTH = 320;
const AVAILABLE_WIDTH = WIDGET_WIDTH - (2 * PADDING);
const TOTAL_CIRCLE_WIDTH = CIRCLE_SIZE + CIRCLE_SPACING;
const COLUMNS = Math.floor(AVAILABLE_WIDTH / TOTAL_CIRCLE_WIDTH);
const ROWS = Math.ceil(DAYS_TOTAL / COLUMNS);

widget.setPadding(12, PADDING, 12, PADDING);

// HEADER
const header = widget.addStack();
header.addSpacer();
const titleText = header.addText(HABIT_NAME);
titleText.font = FONT_BOLD;
titleText.textColor = TEXT_COLOR;
header.addSpacer();

widget.addSpacer(TEXT_SPACING);

// GRID
const gridContainer = widget.addStack();
gridContainer.layoutHorizontally();
gridContainer.addSpacer();
const gridStack = gridContainer.addStack();
gridStack.layoutVertically();
gridContainer.addSpacer();

gridStack.spacing = CIRCLE_SPACING;

for (let row = 0; row < ROWS; row++) {
  const rowStack = gridStack.addStack();
  rowStack.layoutHorizontally();

  for (let col = 0; col < COLUMNS; col++) {
    const dayIndex = row * COLUMNS + col;
    if (dayIndex >= DAYS_TOTAL) continue;

    const dayDate = new Date(START_DATE.getTime() + dayIndex * MS_PER_DAY);
    const key = formatDate(dayDate);
    const filled = habitData[key] === true;

    const circle = rowStack.addText("●");
    circle.font = Font.systemFont(CIRCLE_SIZE);

    const isToday = dayDate.toDateString() === NOW.toDateString();
    if (filled) circle.textColor = COLOR_FILLED;
    else if (isToday) circle.textColor = COLOR_TODAY;
    else if (dayDate < NOW.setHours(0, 0, 0, 0)) circle.textColor = COLOR_MISSED;
    else circle.textColor = COLOR_UNFILLED;

    if (col < COLUMNS - 1) rowStack.addSpacer(CIRCLE_SPACING);
  }
}

widget.addSpacer(TEXT_SPACING);

// FOOTER
const footer = widget.addStack();
footer.layoutHorizontally();

const currentStreak = calculateStreak(habitData, START_DATE, NOW);
const maxStreak = calculateMaxStreak(habitData, START_DATE, END_DATE);

const DAY_INDEX_TODAY = Math.floor((NOW - START_DATE) / MS_PER_DAY) + 1;
const DAYS_PASSED = DAY_INDEX_TODAY;

let filledCount = 0;
for (let i = 0; i <= DAYS_PASSED; i++) {
  const date = new Date(START_DATE.getTime() + i * MS_PER_DAY);
  const key = formatDate(date);
  if (habitData[key] === true) filledCount++;
}

footer.addSpacer(MARGIN_ADJUSTMENT);

const streakText = footer.addText(`${currentStreak}/${maxStreak}`);
streakText.font = FONT_REGULAR;
streakText.textColor = TEXT_COLOR;

footer.addSpacer();

// Days filled / days passed
const progressText = footer.addText(`${filledCount}/${DAYS_PASSED}`);
progressText.font = FONT_REGULAR;
progressText.textColor = TEXT_COLOR;

footer.addSpacer(MARGIN_ADJUSTMENT);

Script.setWidget(widget);
Script.complete();
