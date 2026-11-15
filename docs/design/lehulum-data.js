window.LH = (function () {
  const DUR = 60;
  const TH = {
    light: { bg:'#FAF8F3', sf:'#FFFFFF', s2:'#F1EDE4', tx:'#1C1B18', mu:'#57534A', bd:'#8A8478', ln:'#D9D3C7', ac:'#0A6B4E', oa:'#FFFFFF', hl:'#FFE38A', oh:'#1C1B18', dg:'#B3261E', fc:'#1C1B18', cd:'#1C1B18', ct:'#F3F0E8', scrim:'rgba(28,27,24,.6)', pb:'#14130F', pt:'#F3F0E8', pd:'#8C8678', pa:'#62D6AA', po:'#0B2219', p2:'#2A2721', pm:'#BDB7AA', pfc:'#FFD54A' },
    dark:  { bg:'#14130F', sf:'#1E1C18', s2:'#2A2721', tx:'#F3F0E8', mu:'#BDB7AA', bd:'#8C8678', ln:'#3A3730', ac:'#62D6AA', oa:'#0B2219', hl:'#F5D76E', oh:'#14130F', dg:'#FF8A80', fc:'#FFD54A', cd:'#000000', ct:'#F3F0E8', scrim:'rgba(0,0,0,.7)', pb:'#0E0D0A', pt:'#F3F0E8', pd:'#8C8678', pa:'#62D6AA', po:'#0B2219', p2:'#2A2721', pm:'#BDB7AA', pfc:'#FFD54A' },
    contrast: { bg:'#000000', sf:'#000000', s2:'#000000', tx:'#FFFFFF', mu:'#FFFFFF', bd:'#FFFFFF', ln:'#FFFFFF', ac:'#FFFF00', oa:'#000000', hl:'#FFFF00', oh:'#000000', dg:'#FF8A80', fc:'#00E5FF', cd:'#000000', ct:'#FFFFFF', scrim:'rgba(0,0,0,.85)', pb:'#000000', pt:'#FFFFFF', pd:'#FFFFFF', pa:'#FFFF00', po:'#000000', p2:'#000000', pm:'#FFFFFF', pfc:'#00E5FF' }
  };
  const D = {
    home:['Home','መነሻ'], video:['Video lesson','የቪዲዮ ትምህርት'], text:['Text lesson','የጽሑፍ ትምህርት'], jobs:['Jobs','ሥራዎች'], cert:['Certificate','ሰርተፍኬት'], docs:['API docs','API ሰነዶች'],
    menu:['Menu','ምናሌ'], close:['Close','ዝጋ'], otherLang:['አማርኛ','English'], display:['Display','ማሳያ'], light:['Light','ብሩህ'], dark:['Dark','ጨለማ'], contrast:['High contrast','ከፍተኛ ንፅፅር'],
    play:['Play','አጫውት'], pause:['Pause','አቁም'], back:['Back 10 s','ወደኋላ 10'], fwd:['Fwd 10 s','ወደፊት 10'], speed:['Speed','ፍጥነት'], captions:['Captions','ግርጌ ጽሑፍ'], sign:['Sign','ምልክት'], transcript:['Transcript','ግልባጭ'], screen:['On screen','በማያ ላይ'], settings:['Settings','ቅንብሮች'], keys:['Keys','ቁልፎች'], full:['Full screen','ሙሉ ማያ'], more:['More','ተጨማሪ'], seek:['Seek','ቦታ ፈልግ'], playLesson:['Play lesson','ትምህርቱን አጫውት'],
    howLearn:['How do you want to learn?','እንዴት መማር ይፈልጋሉ?'], chooseMore:['Choose one or more. You can change this any time in Settings.','አንድ ወይም ከዚያ በላይ ይምረጡ። በማንኛውም ጊዜ በቅንብሮች መቀየር ይችላሉ።'],
    listen:['Listen','አዳምጥ'], read:['Read','አንብብ'], saveData:['Save data','ዳታ ቆጥብ'],
    signD:['Ethiopian Sign Language window next to the lesson.','ከትምህርቱ ጎን የኢትዮጵያ ምልክት ቋንቋ መስኮት።'], listenD:['Audio description of what is on screen, read aloud.','በማያ ላይ ያለውን የሚገልጽ ድምፅ።'], readD:['Captions and a transcript you can move through by chapter.','የግርጌ ጽሑፍ እና በምዕራፍ የሚዳሰስ ግልባጭ።'], saveD:['Light lesson: slides with audio, about 1.5 MB.','ቀላል ትምህርት፦ ስላይድ ከድምፅ ጋር፣ 1.5 ሜባ ገደማ።'],
    start:['Start lesson','ትምህርቱን ጀምር'], defaults:['Use default settings','ነባሪ ቅንብሮችን ተጠቀም'], selected:['Selected','ተመርጧል'], notSelected:['Not selected','አልተመረጠም'],
    waiting:['Waiting for signer…','ምልክት አስተርጓሚውን በመጠበቅ ላይ…'], waitingD:['The lesson is paused so the signer can finish. It continues by itself.','ምልክቱ እስኪጨርስ ትምህርቱ ቆሟል። በራሱ ይቀጥላል።'], dontWait:['Don’t wait, continue','አትጠብቅ፣ ቀጥል'],
    swap:['Swap: lesson large','ቀያይር፦ ትምህርት ትልቅ'], signLarge:['Swap: signer large','ቀያይር፦ ምልክት ትልቅ'], autoSign:['Automatic sign (beta)','ራስ-ሰር ምልክት (ሙከራ)'], move:['Move','አንቀሳቅስ'], options:['Options','አማራጮች'], signWin:['Sign window','የምልክት መስኮት'],
    tl:['Top left','ላይ ግራ'], tr:['Top right','ላይ ቀኝ'], bl:['Bottom left','ታች ግራ'], br:['Bottom right','ታች ቀኝ'], smaller:['Smaller','አሳንስ'], larger:['Larger','አስፋ'], see:['See-through','ግልጽ'], on:['On','በርቷል'], off:['Off','ጠፍቷል'],
    wasClear:['Was this sign clear?','ይህ ምልክት ግልጽ ነበር?'], yesClear:['Yes, clear','አዎ፣ ግልጽ'], notClear:['Not clear','ግልጽ አይደለም'], thanks:['Thanks. Your feedback helps improve the signer.','እናመሰግናለን። አስተያየትዎ ምልክቱን ያሻሽላል።'],
    onScreenAt:['On screen at','በማያ ላይ በ'], copy:['Copy code','ኮድ ቅዳ'], copied:['Copied','ተቀድቷል'], glossary:['Sign glossary','የምልክት መዝገበ ቃላት'], pauseLoop:['Pause loop','ድግግሞሽ አቁም'], playLoop:['Play loop','ድግግሞሽ አጫውት'], slower:['Slower 0.5×','ቀርፋፋ 0.5×'], looping:['Looping','በመደጋገም ላይ'], nowPlaying:['Now playing','አሁን በመጫወት ላይ'],
    howWatch:['How do you want to watch?','እንዴት መመልከት ይፈልጋሉ?'], slow:['Slow connection detected (3G)','ቀርፋፋ ግንኙነት ተገኝቷል (3G)'], lightL:['Light lesson','ቀላል ትምህርት'], lightLD:['Slides, audio, captions and sign','ስላይድ፣ ድምፅ፣ ግርጌ ጽሑፍ እና ምልክት'], videoO:['Video','ቪዲዮ'], videoOD:['Full video, 360p','ሙሉ ቪዲዮ፣ 360p'], textO:['Text only','ጽሑፍ ብቻ'], textOD:['Transcript and code, no audio','ግልባጭ እና ኮድ፣ ያለ ድምፅ'], rec:['Recommended','የሚመከር'], watchNow:['Watch now','አሁን ተመልከት'], dlLater:['Download for later','ለኋላ አውርድ'], downloading:['Downloading light lesson','ቀላል ትምህርት በማውረድ ላይ'], cancel:['Cancel','ሰርዝ'], saved:['Saved on this phone','በዚህ ስልክ ላይ ተቀምጧል'], del:['Delete download','ማውረዱን ሰርዝ'], offline:['You are offline','ከመስመር ውጭ ነዎት'], offlineD:['This lesson is not saved on this phone yet. Connect, then choose “Download for later”.','ይህ ትምህርት ገና በስልክዎ አልተቀመጠም። ሲገናኙ “ለኋላ አውርድ” ይምረጡ።'], change:['Change','ቀይር'], keepUsing:['You can keep using your phone.','ስልክዎን መጠቀም ይችላሉ።'], left:['left','ቀርቷል'], playOffline:['Play saved copy','የተቀመጠውን አጫውት'], offlineBadge:['Offline · saved copy','ከመስመር ውጭ · የተቀመጠ'],
    adLabel:['Audio description · video paused','የድምፅ መግለጫ · ቪዲዮ ቆሟል'], skip:['Skip description','መግለጫውን ዝለል'], replay:['Replay','እንደገና'],
    capT:['Captions','ግርጌ ጽሑፍ'], size:['Size','መጠን'], textColour:['Text colour','የጽሑፍ ቀለም'], background:['Background','ዳራ'], position:['Position','ቦታ'], over:['Over the video','በቪዲዮው ላይ'], below:['Below the video','ከቪዲዮው በታች'], white:['White','ነጭ'], yellow:['Yellow','ቢጫ'], black:['Black','ጥቁር'], seeBg:['See-through','ግልጽ'],
    hearing:['Hearing','መስማት'], clearVoice:['Clear voice','ግልጽ ድምፅ'], clear:['Clear','ግልጽ'], extra:['Extra clear','በጣም ግልጽ'], boost:['Volume boost','ድምፅ ማጉያ'], mono:['Mono audio','ሞኖ ድምፅ'], balance:['Balance','ሚዛን'], leftE:['Left','ግራ'], rightE:['Right','ቀኝ'], centre:['Centre','መሃል'],
    adT:['Audio description','የድምፅ መግለጫ'], adOn:['Describe what is on screen','በማያ ላይ ያለውን ግለጽ'], readWith:['Read descriptions with','መግለጫዎችን በዚህ አንብብ'], voice:['Recorded voice','የተቀዳ ድምፅ'], sr:['My screen reader','የእኔ ስክሪን አንባቢ'], adVol:['Description volume','የመግለጫ ድምፅ መጠን'],
    displayT:['Display','ማሳያ'], keyboard:['Keyboard','የቁልፍ ሰሌዳ'], shortcuts:['Keyboard shortcuts','የቁልፍ ሰሌዳ አቋራጮች'], shortcutsD:['Single keys like K (play) and C (captions)','እንደ K (አጫውት) እና C (ግርጌ ጽሑፍ) ያሉ ነጠላ ቁልፎች'], reset:['Reset','ዳግም አስጀምር'], done:['Done','ተከናውኗል'], keysT:['Keyboard help','የቁልፍ ሰሌዳ እገዛ'],
    readingN:['Sentence','ዓረፍተ ነገር'], of:['of','ከ'], prev:['Previous','ቀዳሚ'], next:['Next','ቀጣይ'], stop:['Stop','አቁም'], showingAm:['Showing Amharic','አማርኛ እየታየ ነው'], showingEn:['Showing English','እንግሊዝኛ እየታየ ነው'],
    listenSum:['Listen to summary','ማጠቃለያ አዳምጥ'], pauseSum:['Pause summary','ማጠቃለያ አቁም'], signedSum:['Signed summary','በምልክት ማጠቃለያ'], apply:['Apply','አመልክት'], company:['Company','ድርጅት'], location:['Location','ቦታ'], deadline:['Deadline','የመጨረሻ ቀን'],
    verify:['Verify','አረጋግጥ'], certId:['Certificate ID','የሰርተፍኬት መለያ'], valid:['Valid','ትክክለኛ'], invalid:['Not valid','ትክክል ያልሆነ'],
    chapters:['Chapters','ምዕራፎች'], skipTo:['Skip to content','ወደ ይዘቱ ዝለል']
  };
  const CUES = [
    { s:0, e:5, ch:0, en:'Hello! Today you will make your first variable in Python.', am:'ሰላም! ዛሬ በፓይተን የመጀመሪያ ተለዋዋጭዎን ይሠራሉ።', g:'HELLO TODAY YOU MAKE FIRST VARIABLE PYTHON' },
    { s:5, e:11, ch:0, en:'A variable is a name that holds a value.', am:'ተለዋዋጭ እሴትን የሚይዝ ስም ነው።', g:'VARIABLE WHAT? NAME HOLD VALUE', terms:['variable'], w:1 },
    { s:11, e:17, ch:0, en:'Think of it as a box with a label on it.', am:'ስያሜ የተለጠፈበት ሳጥን አድርገው ያስቡት።', g:'THINK BOX, LABEL ON-TOP' },
    { s:17, e:23, ch:1, en:'Open your code editor and make a new file.', am:'የኮድ አርታኢዎን ከፍተው አዲስ ፋይል ይፍጠሩ።', g:'CODE EDITOR OPEN, FILE NEW MAKE' },
    { s:23, e:31, ch:1, en:['We store the text in a variable called ', { u:'name' }, ', with an equals sign.'], am:['ጽሑፉን ', { u:'name' }, ' በሚባል ተለዋዋጭ ውስጥ በእኩልነት ምልክት እናስቀምጣለን።'], g:'TEXT STORE VARIABLE N-A-M-E EQUALS', terms:['variable'], w:1 },
    { s:31, e:38, ch:1, en:'The text in quotes is called a string.', am:'በትምህርተ ጥቅስ ውስጥ ያለው ጽሑፍ ስትሪንግ ይባላል።', g:'TEXT INSIDE QUOTES, NAME STRING', terms:['string'] },
    { s:38, e:45, ch:2, en:'Now let’s print the value.', am:'አሁን እሴቱን እናትም።', g:'NOW VALUE PRINT', terms:['print'], w:1 },
    { s:45, e:53, ch:2, en:'Run the file. Python shows Abebe on the screen.', am:'ፋይሉን ያሂዱ። ፓይተን Abebe የሚለውን በማያ ላይ ያሳያል።', g:'FILE RUN, SCREEN SHOW A-B-E-B-E' },
    { s:53, e:60, ch:2, en:'Well done. You made your first variable!', am:'በጣም ጥሩ። የመጀመሪያ ተለዋዋጭዎን ሠርተዋል!', g:'WELL DONE! YOU FIRST VARIABLE MAKE FINISH' }
  ];
  const CH = [
    { t:0, en:'What is a variable?', am:'ተለዋዋጭ ምንድን ነው?' },
    { t:17, en:'Creating your first variable', am:'የመጀመሪያ ተለዋዋጭዎን መፍጠር' },
    { t:38, en:'Printing the value', am:'እሴቱን ማተም' }
  ];
  const ADS = [
    { t:24, en:'The screen shows a code editor. Line 1 reads: name equals "Abebe", in quotes.', am:'ማያው የኮድ አርታኢ ያሳያል። መስመር 1፦ name እኩል "Abebe"።' },
    { t:40, en:'Line 2 appears. It reads: print, then name in brackets.', am:'መስመር 2 ታየ፦ print ከዚያም name በቅንፍ ውስጥ።' },
    { t:48, en:'The terminal below shows the output: Abebe.', am:'ከታች ያለው ተርሚናል ውጤቱን ያሳያል፦ Abebe።' }
  ];
  const TERMS = {
    variable:{ en:'variable', am:'ተለዋዋጭ', dEn:'A name that holds a value in a program.', dAm:'በፕሮግራም ውስጥ እሴትን የሚይዝ ስም።', g:'VARIABLE' },
    string:{ en:'string', am:'ስትሪንግ (ሕብረ ቁምፊ)', dEn:'Text inside quotes, like "Abebe".', dAm:'በትምህርተ ጥቅስ ውስጥ ያለ ጽሑፍ፣ ለምሳሌ "Abebe"።', g:'STRING' },
    print:{ en:'print', am:'አትም (print)', dEn:'A command that shows a value on the screen.', dAm:'እሴትን በማያ ላይ የሚያሳይ ትዕዛዝ።', g:'PRINT' }
  };
  const SENT = [
    { en:'A variable is a name that holds a value.', am:'ተለዋዋጭ እሴትን የሚይዝ ስም ነው።', g:'VARIABLE NAME HOLD VALUE' },
    { en:'Think of it as a box with a label on it.', am:'ስያሜ የተለጠፈበት ሳጥን አድርገው ያስቡት።', g:'THINK BOX, LABEL ON-TOP' },
    { en:'In Python, you make a variable by writing a name, an equals sign and a value.', am:'በፓይተን ውስጥ ስም፣ የእኩልነት ምልክት እና እሴት በመጻፍ ተለዋዋጭ ይፈጥራሉ።', g:'PYTHON VARIABLE MAKE: NAME, EQUALS, VALUE WRITE' },
    { en:'This line stores the text “Abebe” in a variable called name.', am:'ይህ መስመር “Abebe” የሚለውን ጽሑፍ name በሚባል ተለዋዋጭ ውስጥ ያስቀምጣል።', g:'THIS LINE TEXT A-B-E-B-E STORE VARIABLE N-A-M-E' },
    { en:'To see the value, use print.', am:'እሴቱን ለማየት print ይጠቀሙ።', g:'VALUE SEE WANT? PRINT USE' },
    { en:'Python shows Abebe on the screen.', am:'ፓይተን Abebe የሚለውን በማያ ላይ ያሳያል።', g:'PYTHON SCREEN SHOW A-B-E-B-E' }
  ];
  const BLOCKS = [
    { h:['What is a variable?','ተለዋዋጭ ምንድን ነው?'] }, { p:[0,1,2] }, { code:'name = "Abebe"' }, { p:[3,4] }, { code:'print(name)' },
    { h:['Seeing the result','ውጤቱን ማየት'] }, { p:[5] }
  ];
  const JOBS = [
    { title:'Junior Python Developer', titleAm:'ጀማሪ የፓይተን ገንቢ', company:'Abay Digital Works', location:'Addis Ababa · remote possible', locAm:'አዲስ አበባ · ከርቀት መሥራት ይቻላል', dlEt:'ኅዳር 22, 2019 ዓ.ም.', dlGr:'1 December 2026',
      en:'Build small web tools with a friendly team. Screen reader and EthSL interpreter support provided.', am:'ከተግባቢ ቡድን ጋር ትናንሽ የድር መሣሪያዎችን ይገንቡ። የስክሪን አንባቢ እና የምልክት ቋንቋ አስተርጓሚ ድጋፍ ይሰጣል።', g:'PYTHON DEVELOPER JUNIOR. TEAM FRIENDLY. INTERPRETER PROVIDE' },
    { title:'Customer Support Agent (Amharic and English)', titleAm:'የደንበኞች አገልግሎት ሠራተኛ', company:'Gojo Connect', location:'Hawassa', locAm:'ሀዋሳ', dlEt:'ታኅሣሥ 6, 2019 ዓ.ም.', dlGr:'15 December 2026',
      en:'Answer customer messages by chat and email. Text-only role, no phone calls.', am:'የደንበኞችን መልእክቶች በቻት እና በኢሜይል ይመልሱ። የጽሑፍ ብቻ ሥራ፣ የስልክ ጥሪ የለም።', g:'CUSTOMER MESSAGE ANSWER, CHAT EMAIL. PHONE CALL NONE' },
    { title:'Data Entry Assistant', titleAm:'የመረጃ ማስገቢያ ረዳት', company:'Lake Tana Agritech', location:'Bahir Dar', locAm:'ባሕር ዳር', dlEt:'ጥር 2, 2019 ዓ.ም.', dlGr:'10 January 2027',
      en:'Enter harvest data into spreadsheets. Training given in sign and in writing.', am:'የምርት መረጃን ወደ ተመን ሉሆች ያስገቡ። ስልጠና በምልክት እና በጽሑፍ ይሰጣል።', g:'HARVEST DATA ENTER SPREADSHEET. TRAINING SIGN AND WRITING' }
  ];
  const VALID_IDS = ['LH-2026-0417-K9'];
  const INSTALL = '<scr' + 'ipt type="module" src="https://cdn.lehulum.org/db-player.js"></scr' + 'ipt>\n\n<db-player src="lesson.mp4" lang="am" sign="auto"></db-player>';
  return { INSTALL, DUR, TH, D, CUES, CH, ADS, TERMS, SENT, BLOCKS, JOBS, VALID_IDS };
})();
