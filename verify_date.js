
const date = new Date();
const formatted = date.toLocaleDateString('en-CA');
console.log("Current System Date:", date.toString());
console.log("Formatted (en-CA):", formatted);

if (formatted.match(/^\d{4}-\d{2}-\d{2}$/)) {
    console.log("PASS: Format is YYYY-MM-DD");
} else {
    console.log("FAIL: Format is incorrect");
}
