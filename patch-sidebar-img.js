import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  '<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRR0PiHdkfbRFE803EY7Ku91d53ElHeMyAysv4RtOMOtTxD6pYVKieaBWE&s=10" />',
  '<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRR0PiHdkfbRFE803EY7Ku91d53ElHeMyAysv4RtOMOtTxD6pYVKieaBWE&s=10" className="w-full h-full object-cover rounded" alt="Logo" />'
);
fs.writeFileSync('src/App.tsx', code);
