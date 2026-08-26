// Parses an Apple Health "export.xml" file (from Health app → profile icon →
// Export All Health Data → unzip → export.xml), keeping only records written
// by Garmin Connect, and aggregating them into daily summaries.
//
// Uses a manual regex scan rather than a full XML DOM parse — export.xml can
// be hundreds of MB for a multi-year history, and building a full DOM tree
// for that in a mobile browser risks running out of memory. This still loads
// the whole file into memory as text once, which is an unavoidable tradeoff
// without a streaming parser; very large histories may take a while.

const GARMIN_QUANTITY_TYPES = {
  HKQuantityTypeIdentifierStepCount: "steps",
  HKQuantityTypeIdentifierRestingHeartRate: "restingHR",
  HKQuantityTypeIdentifierActiveEnergyBurned: "activeCalories",
  HKQuantityTypeIdentifierOxygenSaturation: "spo2",
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: "hrv",
};
const SLEEP_TYPE = "HKCategoryTypeIdentifierSleepAnalysis";

function getAttr(recordStr, name) {
  const m = recordStr.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : null;
}

export async function parseAppleHealthExport(file) {
  const text = await file.text();
  const daily = {};
  const ensure = (date) => {
    if (!daily[date]) daily[date] = { steps: 0, restingHRs: [], activeCalories: 0, spo2s: [], hrvs: [], sleepMinutes: 0 };
    return daily[date];
  };

  const re = /<Record[^>]*\/>/g;
  let match;
  let recordsScanned = 0;
  let garminRecordsUsed = 0;

  while ((match = re.exec(text)) !== null) {
    recordsScanned++;
    const recStr = match[0];
    const sourceName = getAttr(recStr, "sourceName") || "";
    if (!/garmin/i.test(sourceName)) continue;

    const type = getAttr(recStr, "type");
    const startDate = getAttr(recStr, "startDate");
    if (!startDate) continue;
    const date = startDate.slice(0, 10);

    if (type === SLEEP_TYPE) {
      const value = getAttr(recStr, "value");
      const endDate = getAttr(recStr, "endDate");
      if (value && value.includes("Asleep") && endDate) {
        const start = new Date(startDate.replace(" ", "T"));
        const end = new Date(endDate.replace(" ", "T"));
        const mins = (end - start) / 60000;
        if (mins > 0 && mins < 1440) {
          ensure(date).sleepMinutes += mins;
          garminRecordsUsed++;
        }
      }
      continue;
    }

    const key = GARMIN_QUANTITY_TYPES[type];
    if (!key) continue;
    const num = parseFloat(getAttr(recStr, "value"));
    if (isNaN(num)) continue;
    const bucket = ensure(date);
    if (key === "steps") bucket.steps += num;
    else if (key === "restingHR") bucket.restingHRs.push(num);
    else if (key === "activeCalories") bucket.activeCalories += num;
    else if (key === "spo2") bucket.spo2s.push(num > 1 ? num : num * 100);
    else if (key === "hrv") bucket.hrvs.push(num);
    garminRecordsUsed++;
  }

  const result = {};
  Object.keys(daily).forEach((date) => {
    const d = daily[date];
    result[date] = {
      steps: Math.round(d.steps) || null,
      restingHR: d.restingHRs.length ? Math.round(d.restingHRs.reduce((a, b) => a + b, 0) / d.restingHRs.length) : null,
      activeCalories: Math.round(d.activeCalories) || null,
      spo2: d.spo2s.length ? Math.round((d.spo2s.reduce((a, b) => a + b, 0) / d.spo2s.length) * 10) / 10 : null,
      hrv: d.hrvs.length ? Math.round(d.hrvs.reduce((a, b) => a + b, 0) / d.hrvs.length) : null,
      sleepMinutes: Math.round(d.sleepMinutes) || null,
    };
  });

  return { daily: result, recordsScanned, garminRecordsUsed, daysFound: Object.keys(result).length };
}
