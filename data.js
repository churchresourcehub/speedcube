/* Algorithm data used by the page and by the checks in test.js. */
(function (root) {
  'use strict';
  var D = {
    f2l: [
      { name: 'Joined pair', alg: "U R U' R'", note: 'Corner and edge already sit together. Turn the pair away, open the slot, drop it in.' },
      { name: 'Three-move insert', alg: "R U R'", note: 'The edge waits across the top. Raise the slot, slide the edge over the corner, bring both down.' },
      { name: 'Mirror: joined pair', alg: "U' F' U F", note: 'The same joined pair, facing the other way. It goes in from the front.' },
      { name: 'Mirror: three-move insert', alg: "F' U' F", note: 'The same three-move idea done with the front face.' },
      { name: 'White on top', alg: "R U2 R' U' R U R'", note: 'White faces up, so the pieces have to be split and re-joined before they go in.' },
      { name: 'Joined the wrong way', alg: "U R U2 R' U R U' R'", note: 'Corner and edge sit side by side but cannot go in together. Break them apart, then pair them properly.' }
    ],
    ollEdges: [
      { name: 'Dot', alg: "F (R U R' U') F' f (R U R' U') f'", note: 'No edges yellow. Do the line algorithm, then the L algorithm.' },
      { name: 'L shape', alg: "f (R U R' U') f'", note: 'Hold the L in the back-left corner.' },
      { name: 'Line', alg: "F (R U R' U') F'", note: 'Hold the line left to right.' }
    ],
    ollCorners: [
      { name: 'Sune', alg: "R U R' U R U2 R'", note: 'One corner solved, front-left. You may already know this one.' },
      { name: 'Antisune', alg: "R U2 R' U' R U' R'", note: 'Sune run backwards.' },
      { name: 'H', alg: "(R U R' U) (R U' R' U) R U2 R'", note: 'No corners solved, two pairs of headlights.' },
      { name: 'Pi', alg: "R U2 R2 U' R2 U' R2 U2 R", note: 'No corners solved, one pair of headlights on the left.' },
      { name: 'Headlights', alg: "R2 D (R' U2 R) D' (R' U2 R')", note: 'Two corners solved, two yellow stickers facing you.' },
      { name: 'Chameleon', alg: "(r U R' U') (r' F R F')", note: 'Two corners solved on the right. The other two show yellow to the front and the back.' },
      { name: 'Bowtie', alg: "F R' F' r U R U' r'", note: 'Two corners solved on a diagonal.' }
    ],
    pll: [
      { name: 'T', group: 'two', alg: "(R U R' U') (R' F R2 U') R' U' (R U R' F')", note: 'Swaps two corners next to each other. In 2-look PLL this is your corner algorithm.' },
      { name: 'Y', group: 'two', alg: "F (R U' R' U') (R U R' F') (R U R' U') (R' F R F')", note: 'Swaps two corners on a diagonal.' },
      { name: 'Ua', group: 'two', alg: "(R U' R U) R U (R U' R' U') R2", note: 'Three edges cycle. Solved bar at the back.' },
      { name: 'Ub', group: 'two', alg: "R2 U (R U R' U') R' U' (R' U R')", note: 'Three edges cycle the other way.' },
      { name: 'H', group: 'two', alg: "M2 U M2 U2 M2 U M2", note: 'Opposite edges swap.' },
      { name: 'Z', group: 'two', alg: "M' U M2 U M2 U M' U2 M2", note: 'Neighbouring edges swap.' },
      { name: 'Jb', group: 'first', alg: "(R U R' F') (R U R' U') R' F R2 U' R'", note: 'Almost the T perm. Learn it right after.' },
      { name: 'Ja', group: 'first', alg: "x R2 F R F' R U2 r' U r U2 x'", note: 'Mirror partner of Jb.' },
      { name: 'Aa', group: 'first', alg: "x (R' U R') D2 (R U' R') D2 R2 x'", note: 'Three corners cycle.' },
      { name: 'Ab', group: 'first', alg: "x R2 D2 (R U R') D2 (R U' R) x'", note: 'Aa backwards.' },
      { name: 'F', group: 'first', alg: "R' U' F' (R U R' U') (R' F R2 U') (R' U' R U) R' U R", note: 'A T perm with a setup at each end.' },
      { name: 'Ra', group: 'second', alg: "(R U' R' U') (R U R D) (R' U' R D') R' U2 R'", note: '' },
      { name: 'Rb', group: 'second', alg: "R2 F R (U R U' R') F' R U2 R' U2 R", note: '' },
      { name: 'V', group: 'second', alg: "(R' U R' U') (R D' R' D) R' U D' (R2 U' R2) D R2", note: '' },
      { name: 'E', group: 'second', alg: "x' (R U' R' D) (R U R' D') (R U R' D) (R U' R' D') x", note: 'Both pairs of corners swap, no headlights anywhere.' },
      { name: 'Na', group: 'second', alg: "(R U R' U) (R U R' F') (R U R' U') (R' F R2 U') R' U2 R U' R'", note: '' },
      { name: 'Nb', group: 'second', alg: "(R' U R U') (R' F' U' F) (R U R' F) R' F' (R U' R)", note: '' },
      { name: 'Ga', group: 'last', alg: "R2 U (R' U R' U') (R U' R2) D U' (R' U R) D'", note: '' },
      { name: 'Gb', group: 'last', alg: "(R' U' R) U D' (R2 U R' U) (R U' R U') R2 D", note: '' },
      { name: 'Gc', group: 'last', alg: "R2 U' (R U' R U) (R' U R2) D' U (R U' R') D", note: '' },
      { name: 'Gd', group: 'last', alg: "(R U R') U' D (R2 U' R U') (R' U R' U) R2 D'", note: '' }
    ],
    oll: [{"name": "OLL 1", "group": "Dot", "alg": "R U2 R' R' F R F' U2 R' F R F'"}, {"name": "OLL 2", "group": "Dot", "alg": "r U r' U2 r U2 R' U2 R U' r'"}, {"name": "OLL 3", "group": "Dot", "alg": "r' R2 U R' U r U2 r' U M'"}, {"name": "OLL 4", "group": "Dot", "alg": "M U' r U2 r' U' R U' R' M'"}, {"name": "OLL 5", "group": "Square Shape", "alg": "l' U2 L U L' U l"}, {"name": "OLL 6", "group": "Square Shape", "alg": "r U2 R' U' R U' r'"}, {"name": "OLL 7", "group": "Small Lightning Bolt", "alg": "r U R' U R U2 r'"}, {"name": "OLL 8", "group": "Small Lightning Bolt", "alg": "l' U' L U' L' U2 l"}, {"name": "OLL 9", "group": "Fish Shape", "alg": "R U R' U' R' F R2 U R' U' F'"}, {"name": "OLL 10", "group": "Fish Shape", "alg": "R U R' U R' F R F' R U2 R'"}, {"name": "OLL 11", "group": "Small Lightning Bolt", "alg": "r U R' U R' F R F' R U2 r'"}, {"name": "OLL 12", "group": "Small Lightning Bolt", "alg": "M' R' U' R U' R' U2 R U' R r'"}, {"name": "OLL 13", "group": "Knight Move Shape", "alg": "F U R U' R2 F' R U R U' R'"}, {"name": "OLL 14", "group": "Knight Move Shape", "alg": "R' F R U R' F' R F U' F'"}, {"name": "OLL 15", "group": "Knight Move Shape", "alg": "l' U' l L' U' L U l' U l"}, {"name": "OLL 16", "group": "Knight Move Shape", "alg": "r U r' R U R' U' r U' r'"}, {"name": "OLL 17", "group": "Dot", "alg": "F R' F' R2 r' U R U' R' U' M'"}, {"name": "OLL 18", "group": "Dot", "alg": "r U R' U R U2 r' r' U' R U' R' U2 r"}, {"name": "OLL 19", "group": "Dot", "alg": "r' R U R U R' U' M' R' F R F'"}, {"name": "OLL 20", "group": "Dot", "alg": "r U R' U' M2 U R U' R' U' M'"}, {"name": "OLL 21", "group": "Cross", "alg": "R U2 R' U' R U R' U' R U' R'"}, {"name": "OLL 22", "group": "Cross", "alg": "R U2 (R2 U' R2 U' R2) U2 R"}, {"name": "OLL 23", "group": "Cross", "alg": "R2 D' R U2 R' D R U2 R"}, {"name": "OLL 24", "group": "Cross", "alg": "r U R' U' r' F R F'"}, {"name": "OLL 25", "group": "Cross", "alg": "F' r U R' U' r' F R"}, {"name": "OLL 26", "group": "Cross", "alg": "(R U2 R') U' R U' R'"}, {"name": "OLL 27", "group": "Cross", "alg": "R U R' U R U2 R'"}, {"name": "OLL 28", "group": "Corners Oriented", "alg": "r U R' U' r' R U R U' R'"}, {"name": "OLL 29", "group": "Awkward Shape", "alg": "R U R' U' R U' R' F' U' F R U R'"}, {"name": "OLL 30", "group": "Awkward Shape", "alg": "F R' F R2 U' R' U' R U R' F2"}, {"name": "OLL 31", "group": "P Shape", "alg": "R' U' F U R U' R' F' R"}, {"name": "OLL 32", "group": "P Shape", "alg": "L U F' U' L' U L F L'"}, {"name": "OLL 33", "group": "T Shape", "alg": "R U R' U' R' F R F'"}, {"name": "OLL 34", "group": "C Shape", "alg": "R U R2 U' R' F R U R U' F'"}, {"name": "OLL 35", "group": "Fish Shape", "alg": "R U2 R' R' F R F' R U2 R'"}, {"name": "OLL 36", "group": "W Shape", "alg": "L' U' L U' L' U L U L F' L' F"}, {"name": "OLL 37", "group": "Fish Shape", "alg": "F R' F' R U R U' R'"}, {"name": "OLL 38", "group": "W Shape", "alg": "R U R' U R U' R' U' R' F R F'"}, {"name": "OLL 39", "group": "Big Lightning Bolt", "alg": "L F' L' U' L U F U' L'"}, {"name": "OLL 40", "group": "Big Lightning Bolt", "alg": "R' F R U R' U' F' U R"}, {"name": "OLL 41", "group": "Awkward Shape", "alg": "R U R' U R U2 R' F R U R' U' F'"}, {"name": "OLL 42", "group": "Awkward Shape", "alg": "R' U' R U' R' U2 R F R U R' U' F'"}, {"name": "OLL 43", "group": "P Shape", "alg": "F' U' L' U L F"}, {"name": "OLL 44", "group": "P Shape", "alg": "F U R U' R' F'"}, {"name": "OLL 45", "group": "T Shape", "alg": "F R U R' U' F'"}, {"name": "OLL 46", "group": "C Shape", "alg": "R' U' R' F R F' U R"}, {"name": "OLL 47", "group": "Small L Shape", "alg": "R' U' R' F R F' R' F R F' U R"}, {"name": "OLL 48", "group": "Small L Shape", "alg": "F R U R' U' R U R' U' F'"}, {"name": "OLL 49", "group": "Small L Shape", "alg": "r U' r2 U r2 U r2 U' r"}, {"name": "OLL 50", "group": "Small L Shape", "alg": "r' U r2 U' r2 U' r2 U r'"}, {"name": "OLL 51", "group": "I Shape", "alg": "F U R U' R' U R U' R' F'"}, {"name": "OLL 52", "group": "I Shape", "alg": "R U R' U R U' B U' B' R'"}, {"name": "OLL 53", "group": "Small L Shape", "alg": "l' U2 L U L' U' L U L' U l"}, {"name": "OLL 54", "group": "Small L Shape", "alg": "(r U2 R' U') R U R' U' R U' r'"}, {"name": "OLL 55", "group": "I Shape", "alg": "R' F R U R U' R2 F' R2 U' R' U R U R'"}, {"name": "OLL 56", "group": "I Shape", "alg": "(r' U' r) U' R' U R U' R' U R r' U r"}, {"name": "OLL 57", "group": "Corners Oriented", "alg": "R U R' U' M' U R U' r'"}],
    example: [
      { stage: 'Cross', mask: 'cross', alg: "F' R D' L2 D", say: 'Five moves put all four white edges on the bottom, each one under its matching centre. White stays down from here to the end.' },
      { stage: 'Pair 1, back left', mask: 'f2l', alg: "U2 L U L'", say: 'Turn the top until the pair lines up, then a three-move insert into the back-left slot. No cube rotation needed.' },
      { stage: 'Pair 2, back right', mask: 'f2l', alg: "U' R' U R", say: 'A joined pair goes into the back-right slot. Same idea as the front, mirrored.' },
      { stage: 'Pair 3, front left', mask: 'f2l', alg: "U' L' U L", say: 'Another joined pair, into the front left with the left hand.' },
      { stage: 'Pair 4, front right', mask: 'f2l', alg: "U' R U2 R' U' R U R'", say: 'White faces up on this corner, so the pieces are split and re-joined before the insert. Two layers are now done.' },
      { stage: 'OLL look 1', mask: 'oll', alg: "F R U R' U' F'", say: 'The top shows a yellow line. One short algorithm makes the yellow cross.' },
      { stage: 'OLL look 2', mask: 'oll', alg: "U2 R U R' U R U2 R'", say: 'One yellow corner is left on top. Turn it to the front left and do Sune. The whole top is yellow.' },
      { stage: 'PLL look 1', mask: 'pll', alg: "U R U R' U' R' F R2 U' R' U' R U R' F'", say: 'Headlights go on the left, then the T perm fixes the corners.' },
      { stage: 'PLL look 2', mask: 'pll', alg: "U2 R U' R U R U R U' R' U' R2 U'", say: 'The solved bar goes to the back, Ua cycles the last three edges, and one final turn of the top finishes the cube.' }
    ],
    videos: {
      0: [
        { id: '24eHm4ri8WM', t: 'How to Read Algorithms (Full Notation Guide)', by: 'J Perm', why: 'Every letter and symbol, shown on a cube.' }
      ],
      1: [
        { id: 'wLuVF9Dk3AQ', t: 'Finger Tricks Tutorial (Beginner to Advanced)', by: 'J Perm', why: 'The main lesson. Watch the first half now and the rest at Level 4.' },
        { id: 'IWXpkfwimo0', t: '7 Tips For An Efficient Cross Every Solve', by: 'J Perm', why: 'How to build the cross on the bottom without flipping the cube.' },
        { id: 'vmeleO65BHc', t: 'How to Solve the Rubik\'s Cube FASTER with the Beginner Method', by: 'J Perm', why: 'Speed you can find before learning anything new.' },
        { url: 'https://jperm.net/3x3/cfop/cross', t: 'Cross lesson with worked examples', by: 'jperm.net', why: 'Written version with diagrams.' }
      ],
      2: [
        { id: 'Ar_Zit1VLG0', t: 'Learn F2L in 6 minutes (Full Intuitive F2L Tutorial)', by: 'J Perm', why: 'The main lesson for this level.' },
        { id: 'ReOZZHscIGk', t: 'Learn Intuitive F2L [Beginner CFOP]', by: 'CubeHead', why: 'A second teacher, slower pace. Watch if the first one moved too fast.' },
        { id: '3tYj-9f4dA0', t: 'All Standard F2L Cases [Intuitive F2L Mastery]', by: 'CubeHead', why: 'Every case explained by idea, not by memorised moves.' },
        { id: 'NSnIfSIlOP8', t: 'Fix These BAD F2L Habits Before It\'s Too Late', by: 'CubeHead', why: 'Watch after two weeks of F2L to catch habits early.' },
        { id: '1KfmzTewWyI', t: '5 Tips to be Sub-30 on 3x3', by: 'J Perm', why: 'Where this level and the next are heading.' },
        { url: 'https://jperm.net/3x3/cfop/f2l', t: 'F2L lesson, written with diagrams', by: 'jperm.net', why: 'Reference while you practise.' }
      ],
      3: [
        { id: 'GhmYBgLoQQg', t: 'Easy 2-Look OLL Tutorial (Beginner CFOP)', by: 'J Perm', why: 'All ten cases with memory tricks.' },
        { id: 'f_Yor-ydZjs', t: 'Easy 2-Look PLL Tutorial (Beginner CFOP)', by: 'J Perm', why: 'The six permutation algorithms and how to spot them.' },
        { id: 'ydbWt0yTVWY', t: '5 Tips to Learn Algorithms WAY FASTER', by: 'CubeHead', why: 'How to get an algorithm into your hands and keep it there.' },
        { id: 'Y_ysw2reMqo', t: 'Sub-11 with Beginner OLL/PLL', by: 'J Perm', why: 'Proof these sixteen algorithms go a long way.' }
      ],
      4: [
        { id: 'JvqGU0UZPcE', t: 'Fast PLL Algorithms & Finger Tricks', by: 'J Perm', why: 'How to turn each of the 21.' },
        { id: 'sdz5EjWShCg', t: 'How I Recognize PLL Fast (Recognition Method)', by: 'J Perm', why: 'Telling the cases apart at a glance.' },
        { id: 'F4ju-U9OhdA', t: '8-move Cross Example/Walkthrough Solves', by: 'J Perm', why: 'Planning the whole cross in inspection.' },
        { id: 'x93VB_v5ATM', t: 'Advanced Cross Tutorial', by: 'J Perm', why: 'Fewer moves and better finger tricks on the cross.' },
        { id: 'Sw3DpueJsWM', t: 'How to Look Ahead (F2L)', by: 'J Perm', why: 'The single most important skill from here on.' },
        { id: 'bHvoKuN-0c4', t: '5 Tips To Immediately Improve Your F2L Look Ahead', by: 'J Perm', why: 'Practical habits to add one at a time.' },
        { id: '1TzHHPJ_2HY', t: 'How to Solve F2L in the Back', by: 'CubeHead', why: 'Back-slot inserts without rotating the cube.' },
        { id: '3B_oB2YrLvk', t: 'Advanced F2L Tutorial (CFOP)', by: 'J Perm', why: 'Smarter solutions for awkward pairs.' },
        { id: 'EI_ZVEphfuo', t: '7 Last Layer Tips (CFOP)', by: 'J Perm', why: 'Small gains across OLL and PLL.' },
        { id: 'dlecfVyFmrk', t: '5 Tips to be Sub-20 on 3x3', by: 'J Perm', why: 'The checklist for the next barrier.' }
      ],
      5: [
        { id: '47JfJxU7EjM', t: 'All 57 OLL Algorithms & Finger Tricks', by: 'J Perm', why: 'Every case performed, with how to hold it.' },
        { id: 'Ysy1S8ADzqw', t: 'How to Learn Full OLL in ONE MONTH', by: 'CubeHead', why: 'A learning order and schedule.' },
        { id: 'UKRtFQmnKfs', t: 'Best Algorithms For ALL F2L Cases', by: 'J Perm', why: 'Compare against your own solutions and replace the long ones.' },
        { id: 'R2Nopj0O2Gw', t: 'Predicting First Pair! (Cross To F2L Transition)', by: 'J Perm', why: 'Starting F2L with no pause.' },
        { id: 'l-C-u-cWgq0', t: 'Why faster cubers look slow', by: 'J Perm', why: 'What good look-ahead looks like.' },
        { id: 'ow6fc4RTJBc', t: 'Critique: Zhongyi Ho (20.79 Average)', by: 'J Perm', why: 'A coach picking apart a solver at this level.' },
        { id: 'RbwCvP15Fic', t: '5 Tips to be Sub-15 on 3x3', by: 'J Perm', why: 'What comes after 20.' }
      ],
      6: [
        { id: 'P9POsBAaKd0', t: 'X-Cross Tutorial (CFOP)', by: 'J Perm', why: 'Cross and first pair in one go.' },
        { id: 'ED5PDswdbfs', t: '5 Tips to be Sub-12 on 3x3', by: 'J Perm', why: '' },
        { id: '3wRvWW3g-2w', t: '7 Tips to be Sub-10 on 3x3 (CFOP)', by: 'J Perm', why: '' },
        { id: 'NZFp19FcdtQ', t: '9.80 Slow-turning average of 5', by: 'Feliks Zemdegs', why: 'A former world champion under ten seconds without turning fast.' },
        { url: 'https://jperm.net/algs/coll', t: 'COLL list and trainer', by: 'jperm.net', why: '' },
        { url: 'https://jperm.net/algs/zbll', t: 'ZBLL list and trainer', by: 'jperm.net', why: '' },
        { url: 'https://www.cubeskills.com', t: 'CubeSkills', by: 'Feliks Zemdegs', why: 'Structured lessons from beginner to advanced.' },
        { url: 'https://www.worldcubeassociation.org/competitions', t: 'Find a competition', by: 'World Cube Association', why: '' }
      ]
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = D; else root.ALGS = D;
})(this);
