// Scriptable Habit Tracker - John64 (modificato)

// ========================
// =- USER CONFIGURATION -=
// ========================

const HABIT_NAME = "Read";
const START_DATE = new Date(2025, 0, 1);
const END_DATE = new Date(2025, 11, 31);

const BG_COLOR = "#000617";
const BG_OVERLAY_OPACITY = 0.5;

const COLOR_TODAY = new Color("#ffffff");
const COLOR_FILLED = new Color("#ffb135");
const COLOR_MISSED = new Color("#002738");
const COLOR_UNFILLED = new Color("#ffffff", 0.2);

const PADDING = 3;
const CIRCLE_SIZE = 6;
const CIRCLE_SPACING = 3;
const TEXT_SPACING = 7;
const DOT_SHIFT_LEFT = 2;
const YEAR_OFFSET = DOT_SHIFT_LEFT - 2;
const DAYS_LEFT_OFFSET = 0;

const DISPLAY_OPTIONS = ["filled/to_fill", "days left"];
const DISPLAY_OPTION = DISPLAY_OPTIONS[0];

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
  return date.toLocaleDateString();
}

function getTodayKey() {
  return formatDate(new Date());
}

function loadHabitData() {
  if (FM.fileExists(FILE_PATH)) {
    const raw = FM.readString(FILE_PATH);
    return JSON.parse(raw);
  } else {
    return {};
  }
}

function saveHabitData(data) {
  FM.writeString(FILE_PATH, JSON.stringify(data, null, 2));
}

if (!config.runsInWidget) {
  const data = loadHabitData();
  const today = getTodayKey();
  const alreadyLogged = data[today] === true;

  if (alreadyLogged) {
    const alert = new Alert();
    alert.title = "Already registered";
    alert.message = "Do you want to remove today’s progress?";
    alert.addAction("Cancel");
    alert.addDestructiveAction("Remove");

    const response = await alert.present();

    if (response === 1) {
      data[today] = false;
      saveHabitData(data);

      let notify = new Notification();
      notify.title = "Habit removed";
      notify.body = "Today’s entry has been marked as not done.";
      notify.sound = "default";
      await notify.schedule();
    }
  } else {
    data[today] = true;
    saveHabitData(data);
  }

  Script.complete();
  return;
}

const NOW = new Date();
const MS_PER_DAY = 86400000;

const DAYS_TOTAL = Math.round((END_DATE - START_DATE) / MS_PER_DAY) + 1;
const DAYS_UNTIL_END = Math.max(0, Math.round((END_DATE - NOW) / MS_PER_DAY));
const habitData = loadHabitData();

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

const MENLO_REGULAR = new Font("Menlo", 12);
const MENLO_BOLD = new Font("Menlo-Bold", 12);

widget.setPadding(12, PADDING, 12, PADDING);

const gridContainer = widget.addStack();
gridContainer.layoutVertically();

const gridStack = gridContainer.addStack();
gridStack.layoutVertically();
gridStack.spacing = CIRCLE_SPACING;

for (let row = 0; row < ROWS; row++) {
  const rowStack = gridStack.addStack();
  rowStack.layoutHorizontally();
  rowStack.addSpacer(DOT_SHIFT_LEFT);

  for (let col = 0; col < COLUMNS; col++) {
    const dayIndex = row * COLUMNS + col;
    if (dayIndex >= DAYS_TOTAL) continue;

    const dayDate = new Date(START_DATE.getTime() + dayIndex * MS_PER_DAY);
    const key = formatDate(dayDate);
    const filled = habitData[key] === true;

    const circle = rowStack.addText("●");
    circle.font = Font.systemFont(CIRCLE_SIZE);
    circle.textColor = COLOR_MISSED;

    const isToday = dayDate.toDateString() === NOW.toDateString();

    if (filled) {
      circle.textColor = COLOR_FILLED;
    } else if (isToday) {
      circle.textColor = COLOR_TODAY;
    } else if (dayDate < NOW.setHours(0, 0, 0, 0)) {
      circle.textColor = COLOR_MISSED;
    } else {
      circle.textColor = COLOR_UNFILLED;
    }

    if (col < COLUMNS - 1) rowStack.addSpacer(CIRCLE_SPACING);
  }
}

widget.addSpacer(TEXT_SPACING);

const footer = widget.addStack();
footer.layoutHorizontally();

const eventStack = footer.addStack();
eventStack.addSpacer(YEAR_OFFSET);
const eventText = eventStack.addText(HABIT_NAME);
eventText.font = MENLO_BOLD;
eventText.textColor = COLOR_TODAY;

let daysText = "";
if (DISPLAY_OPTION === "filled/to_fill") {
  const DAY_INDEX_TODAY = Math.floor((NOW - START_DATE) / MS_PER_DAY) + 1;
  const DAYS_PASSED = DAY_INDEX_TODAY;

  let filledCount = 0;
  for (let i = 0; i < DAYS_PASSED; i++) {
    const date = new Date(START_DATE.getTime() + i * MS_PER_DAY);
    const key = formatDate(date);
    if (habitData[key] === true) {
      filledCount++;
    }
  }

  daysText = `${filledCount}/${DAYS_PASSED}`;
} else if (DISPLAY_OPTION === "days left") {
  const DAYS_LEFT = Math.max(0, Math.round((END_DATE - NOW) / MS_PER_DAY));
  daysText = `${DAYS_LEFT} days left`;
}

const textWidth = daysText.length * 7.5;
const availableSpace = WIDGET_WIDTH - (PADDING * 2) - YEAR_OFFSET - (eventText.text.length * 7.5);
const spacerLength = availableSpace - textWidth + DAYS_LEFT_OFFSET;

footer.addSpacer(spacerLength);

const daysTextStack = footer.addStack();
const daysLeft = daysTextStack.addText(daysText);
daysLeft.font = MENLO_REGULAR;
daysLeft.textColor = COLOR_TODAY;

Script.setWidget(widget);
Script.complete();

// Based on this countdown script: https://raw.githubusercontent.com/jvscholz/website/refs/heads/master/assets/countdown_widget/countdown.js
