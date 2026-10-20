// ===== WE TIMELINE DATA =====
// Everything students practice comes from this list, transcribed from the "WE" booklet.
// To change wording, edit it here. Keep each era's n (1-9) in chronological order.
const ERAS = [
  { n: 1, name: "COLONIZATION and SLAVERY", start: 1490, end: 1760,
    desc: "Native nations had governments and traditions long before Europeans arrived, and the colonies that followed were built on taken land and enslaved labor.",
    events: [
      { date: "c. 1100–1500", event: "Haudenosaunee Confederacy forms", what: "Five nations join under the Great Law of Peace, one of the world's longest-running representative governments." },
      { date: "1492", event: "Columbus reaches the Caribbean", what: "Spanish claims begin; disease and forced labor devastate Indigenous populations." },
      { date: "1607", event: "Jamestown founded", what: "First permanent English colony in North America; survives on tobacco." },
      { date: "1619", event: "First enslaved Africans arrive in Virginia", what: "Sold to English colonists at Point Comfort." },
      { date: "1620", event: "Mayflower Compact", what: "Separatists landing at Plymouth write their own agreement to govern themselves." },
      { date: "1676", event: "Bacon's Rebellion", what: "Poor colonists of both races revolt; afterward colonies harden slavery along racial lines." },
      { date: "1705", event: "Virginia Slave Codes", what: "Slavery written into law as lifelong, inherited, and defined by race." },
      { date: "1754–1763", event: "French and Indian War", what: "Britain wins control of eastern North America, then taxes the colonies to pay for it." }
    ] },
  { n: 2, name: "REVOLUTION and the NEW NATION", start: 1760, end: 1800,
    desc: "Colonists broke from Britain over who had the right to rule them, then spent twenty years arguing about what should replace it.",
    events: [
      { date: "1765", event: "Stamp Act", what: "First direct British tax on the colonies; protests demand no taxation without representation." },
      { date: "1770", event: "Boston Massacre", what: "British soldiers fire on a crowd; colonists use it as propaganda." },
      { date: "1773", event: "Boston Tea Party", what: "Colonists destroy East India Company tea; Britain responds with the Coercive Acts." },
      { date: "1775", event: "Lexington and Concord", what: "Fighting begins between colonial militia and British troops." },
      { date: "1776", event: "Declaration of Independence", what: "The colonies formally break from Britain and state why." },
      { date: "1781", event: "Victory at Yorktown; Articles of Confederation ratified", what: "The war effectively ends; the first national government takes effect." },
      { date: "1787", event: "Constitutional Convention", what: "Delegates scrap the Articles and write a stronger national government." },
      { date: "1791", event: "Bill of Rights ratified; Whiskey Rebellion", what: "Ten amendments limit federal power in the same years Washington uses force to assert it." }
    ] },
  { n: 3, name: "EXPANSION and REFORM", start: 1800, end: 1850,
    desc: "The country doubled in size, forcing Native nations off their land and carrying slavery west.",
    events: [
      { date: "1803", event: "Louisiana Purchase", what: "Jefferson buys French territory, doubling the size of the country." },
      { date: "1812–1815", event: "War of 1812", what: "A second war with Britain; the U.S. survives and turns westward." },
      { date: "1820", event: "Missouri Compromise", what: "Congress draws a line across the Louisiana Territory to balance slave and free states." },
      { date: "1820s–1840s", event: "Market Revolution", what: "Canals, railroads, and factories transform how Americans work, travel, and buy." },
      { date: "1830", event: "Indian Removal Act", what: "Congress authorizes forcing eastern Native nations west of the Mississippi." },
      { date: "1838", event: "Trail of Tears", what: "The Cherokee are marched to Indian Territory; thousands die." },
      { date: "1846–1848", event: "Mexican-American War", what: "The U.S. takes roughly half of Mexico, reopening the fight over slavery's expansion." },
      { date: "1848", event: "Seneca Falls Convention", what: "The first U.S. women's rights convention issues a Declaration of Sentiments." }
    ] },
  { n: 4, name: "CIVIL WAR and RECONSTRUCTION", start: 1850, end: 1880,
    desc: "Disagreement over slavery split the Union, and after the war the country had to decide who counted as a citizen.",
    events: [
      { date: "1850", event: "Compromise of 1850", what: "California enters free; a harsh Fugitive Slave Act forces northerners into enforcing slavery." },
      { date: "1854", event: "Kansas-Nebraska Act", what: "Settlers vote on slavery; violence follows in “Bleeding Kansas.”" },
      { date: "1857", event: "Dred Scott decision", what: "The Supreme Court rules Black Americans cannot be citizens." },
      { date: "1860", event: "Lincoln elected", what: "Southern states begin seceding before he takes office." },
      { date: "1861–1865", event: "Civil War", what: "Fort Sumter to Appomattox; roughly 750,000 Americans die." },
      { date: "1863", event: "Emancipation Proclamation", what: "Lincoln declares enslaved people in rebelling states free." },
      { date: "1865–1870", event: "13th, 14th, 15th Amendments", what: "Slavery abolished, citizenship defined, voting rights extended to Black men." },
      { date: "1877", event: "Compromise of 1877", what: "Federal troops withdraw from the South; Reconstruction ends." }
    ] },
  { n: 5, name: "INDUSTRY, IMMIGRATION, and EMPIRE", start: 1880, end: 1920,
    desc: "Factories, railroads, and millions of immigrants remade daily life, while the U.S. took territory overseas and segregation hardened at home.",
    events: [
      { date: "1882", event: "Chinese Exclusion Act", what: "The first U.S. law barring immigrants by nationality." },
      { date: "1890", event: "Wounded Knee", what: "The U.S. Army kills roughly 250 Lakota; armed Native resistance on the Plains ends." },
      { date: "1892", event: "Ellis Island opens", what: "Millions of European immigrants arrive over the next three decades." },
      { date: "1896", event: "Plessy v. Ferguson", what: "The Supreme Court upholds “separate but equal,” legalizing segregation." },
      { date: "1898", event: "Spanish-American War", what: "The U.S. takes the Philippines, Puerto Rico, and Guam." },
      { date: "1900s–1910s", event: "Progressive Era", what: "Reformers push food safety, labor laws, and limits on corporate power." },
      { date: "1914–1918", event: "World War I", what: "The U.S. enters in 1917 after years of neutrality." },
      { date: "1920", event: "19th Amendment", what: "Women win the vote nationally after a seventy-year campaign." }
    ] },
  { n: 6, name: "BOOM, BUST, and WORLD WAR", start: 1920, end: 1945,
    desc: "Prosperity collapsed into the worst depression in the nation’s history, and the government took on a far bigger role at home while fighting a war abroad.",
    events: [
      { date: "1920s", event: "Great Migration and Harlem Renaissance", what: "Millions of Black Americans move north; Black art and writing flourish in cities." },
      { date: "1921", event: "Tulsa Race Massacre", what: "A white mob destroys the Greenwood district, killing hundreds." },
      { date: "1920s", event: "Second Ku Klux Klan peaks", what: "Membership reaches into the millions, including outside the South." },
      { date: "1929", event: "Stock market crash", what: "The Great Depression begins; unemployment reaches about 25%." },
      { date: "1933", event: "New Deal begins", what: "Roosevelt expands federal power to fight the Depression." },
      { date: "1941", event: "Pearl Harbor", what: "The U.S. enters World War II." },
      { date: "1942", event: "Japanese American incarceration", what: "Executive Order 9066 forces about 120,000 people into camps." },
      { date: "1945", event: "World War II ends", what: "Atomic bombs on Hiroshima and Nagasaki; the U.S. emerges a superpower." }
    ] },
  { n: 7, name: "COLD WAR and CIVIL RIGHTS", start: 1945, end: 1980,
    desc: "The U.S. squared off with the Soviet Union around the world while Americans fought at home over segregation, rights, and who belonged.",
    events: [
      { date: "1947", event: "Truman Doctrine", what: "The U.S. commits to containing Soviet influence worldwide." },
      { date: "1954", event: "Brown v. Board of Education", what: "The Supreme Court rules school segregation unconstitutional." },
      { date: "1955–1956", event: "Montgomery Bus Boycott", what: "A year-long boycott ends bus segregation and makes King a national figure." },
      { date: "1957", event: "Little Rock Nine", what: "Eisenhower sends federal troops to enforce integration in Arkansas." },
      { date: "1963", event: "March on Washington", what: "A quarter million people gather; King delivers “I Have a Dream.”" },
      { date: "1964–1965", event: "Civil Rights Act and Voting Rights Act", what: "Federal law bans segregation and protects Black voting rights." },
      { date: "1955–1975", event: "Vietnam War", what: "A long, divisive war abroad and mass protest at home." },
      { date: "1969", event: "Moon landing", what: "The U.S. wins the space race." }
    ] },
  { n: 8, name: "A NEW GLOBAL AGE", start: 1980, end: 2010,
    desc: "Conservative politics, a global economy, and new technology reshaped the country, and the September 11 attacks changed how it thought about safety.",
    events: [
      { date: "1980", event: "Reagan elected", what: "A conservative turn toward lower taxes and less regulation." },
      { date: "1989–1991", event: "Berlin Wall falls; Soviet Union collapses", what: "The Cold War ends and the U.S. stands as the sole superpower." },
      { date: "1990", event: "Americans with Disabilities Act", what: "Federal law bans discrimination based on disability." },
      { date: "1990s", event: "Internet and globalization", what: "Trade and communication reshape work and daily life." },
      { date: "2001", event: "September 11 attacks", what: "Nearly 3,000 killed; the U.S. begins the War on Terror." },
      { date: "2003", event: "Iraq War begins", what: "A long, contested war follows the invasion." },
      { date: "2008", event: "Financial crisis; Obama elected", what: "The worst economic collapse since the Depression; the first Black president elected." }
    ] },
  { n: 9, name: "The PRESENT", start: 2010, end: 2030,
    desc: "The era you are living in, still being argued over, with no settled story yet.",
    events: [
      { date: "2015", event: "Obergefell v. Hodges", what: "The Supreme Court rules that same-sex couples have a right to marry nationwide." },
      { date: "2020", event: "COVID-19 pandemic", what: "More than a million Americans die; schools, work, and public life are disrupted." },
      { date: "2020", event: "George Floyd's murder and the protests that followed", what: "One of the largest protest movements in U.S. history." },
      { date: "2020", event: "Presidential election", what: "Biden defeats Trump; the result is contested in court and rejected by many." },
      { date: "2021", event: "January 6", what: "Rioters storm the Capitol seeking to overturn the election result." },
      { date: "2021", event: "Tulsa centennial hearings", what: "Survivors of the 1921 massacre testify before Congress at age 100+." }
    ] }
];

// ===== HINTS =====
// Each era has hints for Level 1 (pair) and Level 2 (place). Students see them in order:
//   1. ask:   a strategy question (free)
//   2. words / event: a clue (makes the round a practice run)
//   3. the answer is highlighted (also a practice run)
// For Level 1, "words" must appear exactly as written in that era's description, so they can be highlighted.
const HINTS = {
  1: { pair:  { ask: "Colonization means starting colonies. Which description talks about colonies being built?", words: ["colonies", "enslaved labor"] },
       place: { ask: "Before there could be a United States, there had to be colonies. Where does that put this era?", event: "Jamestown founded", date: "1607" } },
  2: { pair:  { ask: "A revolution means breaking away from a ruler. Which description has colonists breaking away?", words: ["broke from Britain"] },
       place: { ask: "A new nation has to come right after the colonies break away. Which era comes right after colonization?", event: "Declaration of Independence", date: "1776" } },
  3: { pair:  { ask: "Expansion means getting bigger. Which description says the country grew?", words: ["doubled in size", "west"] },
       place: { ask: "The new country had to exist before it could grow. Which era comes after the new nation?", event: "Louisiana Purchase", date: "1803" } },
  4: { pair:  { ask: "A civil war splits one country in two. Which description has the Union splitting?", words: ["split the Union", "after the war"] },
       place: { ask: "The fight over slavery spreading west led to war. Does the Civil War come before or after expansion?", event: "Civil War", date: "1861–1865" } },
  5: { pair:  { ask: "This name has three clues: industry (factories), immigration (immigrants), and empire (land overseas). Which description has all three?", words: ["Factories", "immigrants", "territory overseas"] },
       place: { ask: "Factories and railroads remade daily life after the Civil War. Which spot comes after Reconstruction?", event: "Ellis Island opens", date: "1892" } },
  6: { pair:  { ask: "Boom and bust means money rising, then crashing. Which description has prosperity collapsing?", words: ["Prosperity collapsed", "depression", "war abroad"] },
       place: { ask: "World War II ended in 1945. Which era ends that year?", event: "Stock market crash", date: "1929" } },
  7: { pair:  { ask: "The Cold War was a standoff with the Soviet Union, and civil rights was a fight at home. Which description has both?", words: ["Soviet Union", "segregation, rights"] },
       place: { ask: "The Cold War started right after World War II ended. Which era starts in 1945?", event: "March on Washington", date: "1963" } },
  8: { pair:  { ask: "Global means the whole world. Which description mentions a global economy?", words: ["global economy", "new technology"] },
       place: { ask: "The Cold War ended when the Soviet Union collapsed around 1991. Which spot comes after the Cold War?", event: "September 11 attacks", date: "2001" } },
  9: { pair:  { ask: "The present means now. Which description is talking about you?", words: ["you are living in"] },
       place: { ask: "The present is now. Where is now on a timeline?", event: "COVID-19 pandemic", date: "2020" } }
};
