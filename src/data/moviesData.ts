import type { Movie } from '../types';

export const MOVIES_DATABASE: Movie[] = [
  {
    id: 'spider-verse',
    title: 'Spider-Man: Across the Spider-Verse',
    tagline: 'It’s how you wear the mask that counts.',
    synopsis: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.',
    year: 2023,
    runtimeMinutes: 140,
    rating: 8.8,
    ageRating: 'PG',
    genres: ['Animation', 'Action', 'Science Fiction', 'Family'],
    moods: ['Excited', 'Adventurous', 'Curious'],
    posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&auto=format&fit=crop&q=85',
    cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac', 'Daniel Kaluuya'],
    director: 'Joaquim Dos Santos, Kemp Powers',
    streamingProvider: 'Prime Video',
    featured: true,
    trending: true,
    familyFavorite: true,
    familySafety: {
      violence: 'Mild comic-book stylized action and mild fantasy peril.',
      language: 'Very mild brief slang; suitable for family viewing.',
      themes: 'Heroism, identity, parent-teen communication and trust.',
      ageAppropriateVerdict: 'A universal crowd-pleaser with stunning visual appeal for all ages.'
    },
    aiInsights: {
      headline: 'A visual masterpiece that unites teens, parents, and kids.',
      matchScore: 98,
      fitReasons: [
        'Groundbreaking art style keeps all ages engaged',
        'Heartfelt parent-teen generational relationship themes',
        'Electrifying pacing with zero slow moments'
      ],
      toneScores: { humor: 78, thrill: 92, emotional: 85, pacing: 95 },
      bestFor: 'Family Movie Night with mixed age groups',
      spoilerFreeVibeCheck: 'Energetic, visually mind-blowing, and deeply emotional without ever feeling heavy.'
    }
  },
  {
    id: 'paddington-2',
    title: 'Paddington 2',
    tagline: 'It takes a bear to catch a thief.',
    synopsis: 'Paddington, now happily settled with the Brown family, picks up a series of odd jobs to buy the perfect 100th birthday present for his Aunt Lucy, only for the gift to be stolen and Paddington framed for the crime.',
    year: 2017,
    runtimeMinutes: 103,
    rating: 8.2,
    ageRating: 'PG',
    genres: ['Comedy', 'Family', 'Drama'],
    moods: ['Happy', 'Relaxed'],
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=85',
    cast: ['Ben Whishaw', 'Hugh Grant', 'Sally Hawkins', 'Hugh Bonneville'],
    director: 'Paul King',
    streamingProvider: 'Prime Video',
    trending: true,
    familyFavorite: true,
    familySafety: {
      violence: 'None. Slapstick comic antics only.',
      language: 'Completely wholesome; zero profanity.',
      themes: 'Kindness, community, optimism, and family solidarity.',
      ageAppropriateVerdict: 'Unanimous family pick from toddlers to grandparents.'
    },
    aiInsights: {
      headline: 'The gold standard for heartwarming family cinema.',
      matchScore: 99,
      fitReasons: [
        '100% positive emotional rating with irresistible humor',
        'Hugh Grant delivers a comedic tour de force',
        'Guaranteed mood lifter after a long exhausting week'
      ],
      toneScores: { humor: 92, thrill: 40, emotional: 88, pacing: 82 },
      bestFor: 'Decompressing with the whole family over dessert',
      spoilerFreeVibeCheck: 'Warm cup of hot cocoa in cinematic form. Pure wholesome joy.'
    }
  },
  {
    id: 'interstellar',
    title: 'Interstellar',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    synopsis: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans through a mysterious wormhole near Saturn.',
    year: 2014,
    runtimeMinutes: 169,
    rating: 8.7,
    ageRating: 'PG-13',
    genres: ['Science Fiction', 'Drama', 'Thriller'],
    moods: ['Curious', 'Adventurous', 'Excited'],
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=85',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    director: 'Christopher Nolan',
    streamingProvider: 'Prime Video',
    featured: true,
    familySafety: {
      violence: 'Tense survival situations, perilous space travel, minor fistfight.',
      language: 'Brief mild PG-13 profanity.',
      themes: 'Sacrifice, love transcending space-time, planetary extinction.',
      ageAppropriateVerdict: 'Ideal for parents, teens, and inquisitive minds 12+.'
    },
    aiInsights: {
      headline: 'A cosmic epic powered by Hans Zimmer’s legendary score.',
      matchScore: 94,
      fitReasons: [
        'Mind-expanding physics and awe-inspiring celestial visuals',
        'Deep emotional core centered on father-daughter connection',
        'Sparks lively post-movie living room debates'
      ],
      toneScores: { humor: 25, thrill: 85, emotional: 95, pacing: 75 },
      bestFor: 'Big screen immersive evening with teens and adults',
      spoilerFreeVibeCheck: 'Profoundly moving, intellectually stimulating, and audibly breathtaking.'
    }
  },
  {
    id: 'knives-out',
    title: 'Knives Out',
    tagline: 'Hell, any of them could have done it.',
    synopsis: 'A detective investigates the death of a patriarch of an eccentric, combative family. Everyone is a suspect, everyone has a secret, and every clue turns the puzzle upside down.',
    year: 2019,
    runtimeMinutes: 130,
    rating: 7.9,
    ageRating: 'PG-13',
    genres: ['Comedy', 'Drama', 'Thriller'],
    moods: ['Curious', 'Excited', 'Happy'],
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1600&auto=format&fit=crop&q=85',
    cast: ['Daniel Craig', 'Ana de Armas', 'Chris Evans', 'Jamie Lee Curtis'],
    director: 'Rian Johnson',
    streamingProvider: 'Prime Video',
    trending: true,
    familySafety: {
      violence: 'Murder mystery setting, discussion of death, comedic suspense.',
      language: 'Some coarse language throughout.',
      themes: 'Greed, inheritance squabbles, morality and honesty.',
      ageAppropriateVerdict: 'Great for family members 13 and older who love parlor mysteries.'
    },
    aiInsights: {
      headline: 'Clever whodunit filled with biting wit and cozy autumn aesthetics.',
      matchScore: 91,
      fitReasons: [
        'Engages everyone in guessing the killer together',
        'Daniel Craig’s Southern detective Benoit Blanc is endlessly entertaining',
        'Sharp comedic timing without feeling silly'
      ],
      toneScores: { humor: 84, thrill: 72, emotional: 55, pacing: 88 },
      bestFor: 'Interactive couch mystery game night',
      spoilerFreeVibeCheck: 'Crisp, witty, stylish, and immensely satisfying puzzle solve.'
    }
  },
  {
    id: 'mitchells-vs-machines',
    title: 'The Mitchells vs. the Machines',
    tagline: 'Meet the Mitchells. Earth’s last hope.',
    synopsis: 'A quirky, dysfunctional family’s road trip is upended when they find themselves in the middle of the robot apocalypse and suddenly become humanity’s unlikeliest last hope.',
    year: 2021,
    runtimeMinutes: 113,
    rating: 7.6,
    ageRating: 'PG',
    genres: ['Animation', 'Comedy', 'Science Fiction', 'Family', 'Action'],
    moods: ['Happy', 'Excited', 'Adventurous'],
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=85',
    cast: ['Abbi Jacobson', 'Danny McBride', 'Maya Rudolph', 'Olivia Colman'],
    director: 'Mike Rianda',
    streamingProvider: 'Prime Video',
    familyFavorite: true,
    familySafety: {
      violence: 'Cartoon robot chaos, lasers, harmless comedic slapstick.',
      language: 'Completely family-friendly.',
      themes: 'Parental acceptance of kids’ creative passions, balancing screen time.',
      ageAppropriateVerdict: 'Perfect family consensus pick for all generations.'
    },
    aiInsights: {
      headline: 'Relatable modern parenting struggles wrapped in hyper-kinetic laughs.',
      matchScore: 97,
      fitReasons: [
        'Captures contemporary tech anxiety with hilarious honesty',
        'Parents will deeply relate to the father-daughter roadtrip bonding',
        'Non-stop visual gags that reward repeat watches'
      ],
      toneScores: { humor: 94, thrill: 76, emotional: 82, pacing: 92 },
      bestFor: 'Family bonding when everyone is glued to their smartphones',
      spoilerFreeVibeCheck: 'Infectious energy, laugh-out-loud humor, and a warm family hug.'
    }
  },
  {
    id: 'past-lives',
    title: 'Past Lives',
    tagline: 'What if you held on to the one that got away?',
    synopsis: 'Nora and Hae Sung, two deeply connected childhood friends, are wrested apart after Nora’s family emigrates from South Korea. Two decades later, they are reunited in New York for one fateful week.',
    year: 2023,
    runtimeMinutes: 105,
    rating: 7.9,
    ageRating: 'PG-13',
    genres: ['Drama'],
    moods: ['Romantic', 'Relaxed', 'Curious'],
    posterUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1600&auto=format&fit=crop&q=85',
    cast: ['Greta Lee', 'Teo Yoo', 'John Magaro'],
    director: 'Celine Song',
    streamingProvider: 'Paramount+',
    familySafety: {
      violence: 'None whatsoever.',
      language: 'Brief strong language in one scene.',
      themes: 'Fate (In-Yun), mature relationships, quiet contemplation, immigrant identity.',
      ageAppropriateVerdict: 'Tailored for adults and older teens looking for thoughtful cinema.'
    },
    aiInsights: {
      headline: 'A tender, poetic exploration of destiny, love, and parallel paths.',
      matchScore: 92,
      fitReasons: [
        'Gentle, quiet, and deeply reflective pacing',
        'Magnificent performances that linger for days',
        'Avoids melodrama; honors every character with respect'
      ],
      toneScores: { humor: 30, thrill: 15, emotional: 96, pacing: 55 },
      bestFor: 'Quiet date night or late-evening solo unwind',
      spoilerFreeVibeCheck: 'Intimate, wistful, graceful, and emotionally resonant.'
    }
  },
  {
    id: 'super-mario',
    title: 'The Super Mario Bros. Movie',
    tagline: 'Let’s-a go!',
    synopsis: 'While working underground to fix a water main, Brooklyn plumbers Mario and brother Luigi are transported down a mysterious pipe and wander into a magical new world.',
    year: 2023,
    runtimeMinutes: 92,
    rating: 7.1,
    ageRating: 'PG',
    genres: ['Animation', 'Family', 'Action', 'Comedy'],
    moods: ['Happy', 'Excited', 'Adventurous'],
    posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600&auto=format&fit=crop&q=85',
    cast: ['Chris Pratt', 'Anya Taylor-Joy', 'Charlie Day', 'Jack Black'],
    director: 'Aaron Horvath, Michael Jelenic',
    streamingProvider: 'Prime Video',
    trending: true,
    familyFavorite: true,
    familySafety: {
      violence: 'Mild video game action, Koopa shells, lava jumps, comedic battles.',
      language: 'Gquean and harmless.',
      themes: 'Brotherly love, determination, standing up to bullies.',
      ageAppropriateVerdict: 'A hit with young kids and nostalgic 80s/90s gaming parents.'
    },
    aiInsights: {
      headline: 'A colorful, brisk 90-minute rush of pure video game nostalgia.',
      matchScore: 93,
      fitReasons: [
        'Short 92-minute runtime keeps bedtime schedules intact',
        'Jack Black’s Bowser song steals the entire show',
        'Vibrant eye-popping animations keep youngest kids glued'
      ],
      toneScores: { humor: 85, thrill: 70, emotional: 50, pacing: 98 },
      bestFor: 'Kids’ Friday night kickoff or family pizza party',
      spoilerFreeVibeCheck: 'Fast-paced, colorful sugar rush with irresistible classic sound effects.'
    }
  },
  {
    id: 'dune-2',
    title: 'Dune: Part Two',
    tagline: 'Long live the fighters.',
    synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future.',
    year: 2024,
    runtimeMinutes: 166,
    rating: 8.6,
    ageRating: 'PG-13',
    genres: ['Science Fiction', 'Action', 'Drama'],
    moods: ['Adventurous', 'Excited', 'Curious'],
    posterUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1600&auto=format&fit=crop&q=85',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler'],
    director: 'Denis Villeneuve',
    streamingProvider: 'Max',
    featured: true,
    familySafety: {
      violence: 'Intense sci-fi combat, blade fighting, sandworm rides, war destruction.',
      language: 'Some mild language.',
      themes: 'Prophecy, religious fanaticism, empire, loyalty and consequence.',
      ageAppropriateVerdict: 'Best suited for teens 13+ and parents who love grandiose sci-fi.'
    },
    aiInsights: {
      headline: 'A generational cinematic triumph with thunderous sound and sand-scale spectacle.',
      matchScore: 96,
      fitReasons: [
        'Benchmark audio-visual demo on high-end Fire TV 4K setups',
        'Complex, morally layered character arcs that defy clichés',
        'Zendaya and Chalamet deliver electrifying chemistry'
      ],
      toneScores: { humor: 18, thrill: 96, emotional: 80, pacing: 84 },
      bestFor: 'Cinematic home-theater experience with the lights off',
      spoilerFreeVibeCheck: 'Colossal scale, majestic worldbuilding, and relentless desert drama.'
    }
  },
  {
    id: 'wall-e',
    title: 'WALL-E',
    tagline: 'After 700 years of doing what he was built for, he’ll discover what he was meant for.',
    synopsis: 'In a distant future where humanity has abandoned a garbage-strewn Earth, a small waste-collecting robot inadvertently embarks on a space journey that will ultimately decide the fate of mankind.',
    year: 2008,
    runtimeMinutes: 98,
    rating: 8.4,
    ageRating: 'G',
    genres: ['Animation', 'Family', 'Science Fiction'],
    moods: ['Relaxed', 'Romantic', 'Happy', 'Curious'],
    posterUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&auto=format&fit=crop&q=85',
    cast: ['Ben Burtt', 'Elissa Knight', 'Jeff Garlin', 'Fred Willard'],
    director: 'Andrew Stanton',
    streamingProvider: 'Prime Video',
    familyFavorite: true,
    familySafety: {
      violence: 'Comedic robot scuffles and brief laser zaps; completely harmless.',
      language: 'Completely wholesome; rated G.',
      themes: 'Environmental care, connection, human rekindling of curiosity.',
      ageAppropriateVerdict: 'Universal masterpiece for all human beings.'
    },
    aiInsights: {
      headline: 'Silent cinema brilliance with an environmental heart and sweet romance.',
      matchScore: 98,
      fitReasons: [
        'Virtually dialogue-free first 40 minutes mesmerizes toddlers and adults alike',
        'Sublime romantic connection between two mechanical souls',
        'Brisk 98-minute runtime'
      ],
      toneScores: { humor: 75, thrill: 60, emotional: 94, pacing: 80 },
      bestFor: 'Cozy Sunday evening with blankets and family',
      spoilerFreeVibeCheck: 'Charming, poignant, visually stunning, and timelessly wholesome.'
    }
  },
  {
    id: 'top-gun-maverick',
    title: 'Top Gun: Maverick',
    tagline: 'Feel the need.',
    synopsis: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN’s elite graduates on an impossible mission.',
    year: 2022,
    runtimeMinutes: 130,
    rating: 8.3,
    ageRating: 'PG-13',
    genres: ['Action', 'Drama'],
    moods: ['Excited', 'Adventurous'],
    posterUrl: 'https://images.unsplash.com/photo-1517976487502-5f65a7e3725b?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=1600&auto=format&fit=crop&q=85',
    cast: ['Tom Cruise', 'Miles Teller', 'Jennifer Connelly', 'Jon Hamm'],
    director: 'Joseph Kosinski',
    streamingProvider: 'Paramount+',
    trending: true,
    familySafety: {
      violence: 'Aerial dogfights, jet crashes, military danger, bar brawl.',
      language: 'Moderate PG-13 profanity.',
      themes: 'Mentorship, overcoming guilt, camaraderie, courage under pressure.',
      ageAppropriateVerdict: 'A total crowd-pleaser for parents and teens.'
    },
    aiInsights: {
      headline: 'Real cockpit G-forces deliver unmatched crowd-cheering energy.',
      matchScore: 95,
      fitReasons: [
        'Practically filmed flight sequences create breathtaking realism',
        'Multi-generational appeal bridges parents and teenagers seamlessly',
        'Pure edge-of-your-seat adrenaline in the third act'
      ],
      toneScores: { humor: 65, thrill: 98, emotional: 78, pacing: 94 },
      bestFor: 'High-energy weekend movie night with booming speakers',
      spoilerFreeVibeCheck: 'Exhilarating, celebratory, patriotic, and expertly calibrated thrills.'
    }
  },
  {
    id: 'wonka',
    title: 'Wonka',
    tagline: 'Discover how Willy became Wonka.',
    synopsis: 'Armed with nothing but a hatful of dreams, young chocolatier Willy Wonka sets out to change the world one delectable bite at a time, taking on a corrupt chocolate cartel.',
    year: 2023,
    runtimeMinutes: 116,
    rating: 7.1,
    ageRating: 'PG',
    genres: ['Family', 'Comedy', 'Animation'],
    moods: ['Happy', 'Adventurous', 'Curious'],
    posterUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600&auto=format&fit=crop&q=85',
    cast: ['Timothée Chalamet', 'Calah Lane', 'Hugh Grant', 'Keegan-Michael Key'],
    director: 'Paul King',
    streamingProvider: 'Max',
    familyFavorite: true,
    familySafety: {
      violence: 'Mild comical peril and eccentric villain schemes.',
      language: 'Very clean; safe for elementary school viewers.',
      themes: 'Creativity, generosity, standing up for fair chances, friendship.',
      ageAppropriateVerdict: 'Delightful family spectacle with catchy original songs.'
    },
    aiInsights: {
      headline: 'A confection of joy, whimsy, and magical musical numbers.',
      matchScore: 90,
      fitReasons: [
        'Timothée Chalamet brings earnest, sweet charm to Willy Wonka',
        'Directed by Paul King (Paddington director) ensuring heart and cleverness',
        'Visually lavish set designs and mouthwatering confections'
      ],
      toneScores: { humor: 84, thrill: 52, emotional: 80, pacing: 83 },
      bestFor: 'Sweet-tooth family gatherings and holiday vibes',
      spoilerFreeVibeCheck: 'Enchanting, theatrical, heartwarming, and full of musical wonder.'
    }
  },
  {
    id: 'la-la-land',
    title: 'La La Land',
    tagline: 'Here’s to the fools who dream.',
    synopsis: 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future with the reality of their relationship.',
    year: 2016,
    runtimeMinutes: 128,
    rating: 8.0,
    ageRating: 'PG-13',
    genres: ['Drama', 'Comedy'],
    moods: ['Romantic', 'Happy', 'Curious'],
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=85',
    cast: ['Ryan Gosling', 'Emma Stone', 'John Legend', 'Rosemarie DeWitt'],
    director: 'Damien Chazelle',
    streamingProvider: 'Prime Video',
    familySafety: {
      violence: 'None.',
      language: 'One strong word and occasional mild curse words.',
      themes: 'Pursuing dreams, sacrifice in relationships, bittersweet nostalgia.',
      ageAppropriateVerdict: 'A vibrant modern musical suited for teens and couples.'
    },
    aiInsights: {
      headline: 'A dazzling tribute to Old Hollywood glamour and modern jazz.',
      matchScore: 92,
      fitReasons: [
        'Unforgettable musical score by Justin Hurwitz',
        'Emma Stone and Ryan Gosling share peerless screen chemistry',
        'A bittersweet, mature finale that honors artistic ambition'
      ],
      toneScores: { humor: 70, thrill: 25, emotional: 92, pacing: 78 },
      bestFor: 'Couples or musical theatre lovers settling in for the evening',
      spoilerFreeVibeCheck: 'Glamorous, romantic, technicolor-rich, and melancholically sweet.'
    }
  },
  {
    id: 'arrival',
    title: 'Arrival',
    tagline: 'Why are they here?',
    synopsis: 'A linguistics professor leads an elite team of investigators when gigantic spaceships touch down in twelve locations around the world, racing against global paranoia to decipher alien communication.',
    year: 2016,
    runtimeMinutes: 116,
    rating: 7.9,
    ageRating: 'PG-13',
    genres: ['Science Fiction', 'Drama', 'Thriller'],
    moods: ['Curious', 'Relaxed'],
    posterUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?w=1600&auto=format&fit=crop&q=85',
    cast: ['Amy Adams', 'Jeremy Renner', 'Forest Whitaker', 'Michael Stuhlbarg'],
    director: 'Denis Villeneuve',
    streamingProvider: 'Paramount+',
    familySafety: {
      violence: 'Brief military tension, a bomb explosion from afar, no gore.',
      language: 'Brief PG-13 profanity.',
      themes: 'Communication, empathy across barriers, grief, time and choice.',
      ageAppropriateVerdict: 'Deeply thoughtful sci-fi for ages 13+ and adults.'
    },
    aiInsights: {
      headline: 'A philosophical masterpiece proving intellect triumphs over weapons.',
      matchScore: 93,
      fitReasons: [
        'Replaces lasers with linguistic detective work',
        'Amy Adams gives an emotionally devastating, Oscar-worthy performance',
        'Stunning plot reveal redefines the entire story on reflection'
      ],
      toneScores: { humor: 10, thrill: 72, emotional: 93, pacing: 70 },
      bestFor: 'Thought-provoking late night watch that sparks conversation',
      spoilerFreeVibeCheck: 'Hypnotic, cerebral, haunting, and transcendentally peaceful.'
    }
  },
  {
    id: 'spirited-away',
    title: 'Spirited Away',
    tagline: 'Nothing that happens is ever forgotten, even if you can’t remember it.',
    synopsis: 'During her family’s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, where humans are changed into beasts.',
    year: 2001,
    runtimeMinutes: 125,
    rating: 8.6,
    ageRating: 'PG',
    genres: ['Animation', 'Family', 'Drama', 'Action'],
    moods: ['Curious', 'Adventurous', 'Relaxed'],
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=85',
    cast: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki'],
    director: 'Hayao Miyazaki',
    streamingProvider: 'Max',
    familyFavorite: true,
    familySafety: {
      violence: 'Mild fantasy peril and bizarre spirit creatures; non-violent.',
      language: 'Completely clean.',
      themes: 'Self-reliance, courage, respecting traditions and nature.',
      ageAppropriateVerdict: 'A timeless animated fairy tale for ages 8 to 100.'
    },
    aiInsights: {
      headline: 'Studio Ghibli’s crowning jewel of imagination and spiritual wonder.',
      matchScore: 96,
      fitReasons: [
        'Astonishing handcrafted artwork and unforgettable Joe Hisaishi score',
        'Empowering journey of a young girl discovering inner resilience',
        'Captivates viewers without standard formulaic tropes'
      ],
      toneScores: { humor: 60, thrill: 58, emotional: 86, pacing: 76 },
      bestFor: 'Imaginative family evening journey into fantasy',
      spoilerFreeVibeCheck: 'Dreamlike, enchanting, lush, and endlessly imaginative.'
    }
  },
  {
    id: 'a-quiet-place',
    title: 'A Quiet Place',
    tagline: 'If they hear you, they hunt you.',
    synopsis: 'In a post-apocalyptic world, a family is forced to live in silence while hiding from monsters with ultra-sensitive hearing. As a birth approaches, survival requires extreme ingenuity.',
    year: 2018,
    runtimeMinutes: 90,
    rating: 7.5,
    ageRating: 'PG-13',
    genres: ['Thriller', 'Science Fiction', 'Drama'],
    moods: ['Excited', 'Curious'],
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=85',
    cast: ['Emily Blunt', 'John Krasinski', 'Millicent Simmonds', 'Noah Jupe'],
    director: 'John Krasinski',
    streamingProvider: 'Paramount+',
    familySafety: {
      violence: 'Alien monster attacks, sustained suspense, blood injury details.',
      language: 'Barely any spoken dialogue; practically zero profanity.',
      themes: 'Parental protective instinct, family sacrifice, resilience.',
      ageAppropriateVerdict: 'Suspenseful thriller for teens and parents who enjoy jump scares.'
    },
    aiInsights: {
      headline: 'Masterclass in sound design that will keep your living room dead silent.',
      matchScore: 89,
      fitReasons: [
        'Short 90-minute runtime keeps tension coiled tight',
        'Puts family survival and parental devotion front and center',
        'Inventive storytelling using sign language and visual cues'
      ],
      toneScores: { humor: 10, thrill: 98, emotional: 82, pacing: 94 },
      bestFor: 'High-stakes Friday night thriller with the sound bar cranked up',
      spoilerFreeVibeCheck: 'Nail-biting, claustrophobic, visceral, and heart-pounding.'
    }
  },
  {
    id: 'puss-in-boots-2',
    title: 'Puss in Boots: The Last Wish',
    tagline: 'Say hola to his last life.',
    synopsis: 'When Puss in Boots discovers that his passion for adventure has taken its toll and he has burned through eight of his nine lives, he launches an epic journey to find the mythical Wishing Star and restore his lives.',
    year: 2022,
    runtimeMinutes: 102,
    rating: 7.9,
    ageRating: 'PG',
    genres: ['Animation', 'Family', 'Action', 'Comedy'],
    moods: ['Adventurous', 'Excited', 'Happy'],
    posterUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=85',
    cast: ['Antonio Banderas', 'Salma Hayek', 'Harvey Guillén', 'Florence Pugh'],
    director: 'Joel Crawford',
    streamingProvider: 'Prime Video',
    familyFavorite: true,
    familySafety: {
      violence: 'Stylized sword duels, menacing wolf bounty hunter, comedic fairy-tale action.',
      language: 'Very mild; family safe.',
      themes: 'Appreciating the one life you have, friendship, overcoming anxiety.',
      ageAppropriateVerdict: 'A runaway crowd favorite for all age brackets.'
    },
    aiInsights: {
      headline: 'Visually dazzling animation with surprisingly deep wisdom on mortality.',
      matchScore: 96,
      fitReasons: [
        'Dynamic comic-book animation style rivaling Spider-Verse',
        'Therapy-dog Perrito brings endless unironic positivity',
        'Balances genuine thrills with belly laughs'
      ],
      toneScores: { humor: 88, thrill: 82, emotional: 80, pacing: 92 },
      bestFor: 'Action-packed family movie night where everyone stays glued',
      spoilerFreeVibeCheck: 'Swashbuckling, laugh-out-loud funny, stylistically gorgeous, and surprisingly poignant.'
    }
  },
  {
    id: 'free-guy',
    title: 'Free Guy',
    tagline: 'Life’s too short to be a background character.',
    synopsis: 'A bank teller discovers that he’s actually an NPC inside a brutal open-world video game, and decides to become the hero of his own story—rewriting his destiny and saving his world before the creators shut it down.',
    year: 2021,
    runtimeMinutes: 115,
    rating: 7.1,
    ageRating: 'PG-13',
    genres: ['Action', 'Comedy', 'Science Fiction'],
    moods: ['Happy', 'Excited', 'Adventurous'],
    posterUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=85',
    cast: ['Ryan Reynolds', 'Jodie Comer', 'Taika Waititi', 'Joe Keery'],
    director: 'Shawn Levy',
    streamingProvider: 'Prime Video',
    trending: true,
    familySafety: {
      violence: 'Video game violence with respawns, explosions, superhero brawl.',
      language: 'Occasional PG-13 comedic profanity.',
      themes: 'Free will, kindness, stepping out of comfort zones, creativity.',
      ageAppropriateVerdict: 'A laugh-riot for teens, gamers, and parents alike.'
    },
    aiInsights: {
      headline: 'Ryan Reynolds at peak charming charisma in a joyful gamer playground.',
      matchScore: 91,
      fitReasons: [
        'Endless gaming cameos and clever Easter eggs',
        'Infectious feel-good optimism where the nice guy wins',
        'Fast-paced laughs that keep everyone entertained'
      ],
      toneScores: { humor: 92, thrill: 74, emotional: 68, pacing: 90 },
      bestFor: 'Lively group viewing with teenagers and gamers',
      spoilerFreeVibeCheck: 'Upbeat, colorful, charming, and packed with pop-culture energy.'
    }
  },
  {
    id: 'school-of-rock',
    title: 'School of Rock',
    tagline: 'We shall teach rock and roll to the world!',
    synopsis: 'After being kicked out of his rock band, Dewey Finn poses as a substitute teacher at an uptight prep school and tries to turn his fifth-grade class into a rock ensemble to compete in the Battle of the Bands.',
    year: 2003,
    runtimeMinutes: 109,
    rating: 7.2,
    ageRating: 'PG-13',
    genres: ['Comedy', 'Family'],
    moods: ['Happy', 'Excited'],
    posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&auto=format&fit=crop&q=85',
    cast: ['Jack Black', 'Joan Cusack', 'Mike White', 'Sarah Silverman'],
    director: 'Richard Linklater',
    streamingProvider: 'Paramount+',
    familySafety: {
      violence: 'None. Energetic stage dives and music antics.',
      language: 'Mild comedic profanity.',
      themes: 'Self-expression, boosting kids’ confidence, joy of music.',
      ageAppropriateVerdict: 'High-energy comedy classic for the whole family.'
    },
    aiInsights: {
      headline: 'Jack Black’s unmatched comedic electrical surge will have everyone air-guitaring.',
      matchScore: 93,
      fitReasons: [
        'Real kids playing real musical instruments creates genuine heart',
        'Classic rock soundtrack that parents love introducing to kids',
        'Heartwarming message about embracing your unique voice'
      ],
      toneScores: { humor: 95, thrill: 50, emotional: 75, pacing: 88 },
      bestFor: 'Friday night family jam session and sing-along',
      spoilerFreeVibeCheck: 'Riotous, uplifting, musical, and impossible not to tap your toes to.'
    }
  },
  {
    id: 'my-neighbor-totoro',
    title: 'My Neighbor Totoro',
    tagline: 'A heartwarming story of childhood and wondrous forest spirits.',
    synopsis: 'Two young sisters move to the countryside to be near their ailing mother, and discover that the surrounding forest is inhabited by friendly spirits, including the gentle giant Totoro.',
    year: 1988,
    runtimeMinutes: 86,
    rating: 8.1,
    ageRating: 'G',
    genres: ['Animation', 'Family'],
    moods: ['Relaxed', 'Happy'],
    posterUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=85',
    cast: ['Noriko Hidaka', 'Chika Sakamoto', 'Hitoshi Takagi'],
    director: 'Hayao Miyazaki',
    streamingProvider: 'Max',
    familyFavorite: true,
    familySafety: {
      violence: 'Completely non-violent; zero threats.',
      language: '100% clean; rated G.',
      themes: 'Sisterhood, connection with nature, coping with parent illness gently.',
      ageAppropriateVerdict: 'The most calming, gentle family film ever created.'
    },
    aiInsights: {
      headline: 'A soothing balm of rural peace and childhood innocence.',
      matchScore: 95,
      fitReasons: [
        'Short 86-minute runtime, perfect for bedtime winding down',
        'Zero villains or conflict; pure peaceful exploration',
        'Lovable creature designs that delight every age'
      ],
      toneScores: { humor: 70, thrill: 15, emotional: 85, pacing: 65 },
      bestFor: 'Wind-down Sunday afternoon or calming hyperactive kids',
      spoilerFreeVibeCheck: 'Cozy, serene, magical, and like a warm hug on a rainy afternoon.'
    }
  },
  {
    id: 'oceans-eleven',
    title: 'Ocean’s Eleven',
    tagline: 'Are you in or out?',
    synopsis: 'Danny Ocean and his ten accomplices plan to rob three Las Vegas casinos simultaneously during a marquee boxing event, pulling off the most elaborate heist in Sin City history.',
    year: 2001,
    runtimeMinutes: 116,
    rating: 7.7,
    ageRating: 'PG-13',
    genres: ['Thriller', 'Comedy', 'Action'],
    moods: ['Relaxed', 'Excited', 'Curious'],
    posterUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=85',
    cast: ['George Clooney', 'Brad Pitt', 'Matt Damon', 'Julia Roberts'],
    director: 'Steven Soderbergh',
    streamingProvider: 'Prime Video',
    familySafety: {
      violence: 'Very stylish, bloodless casino heist; mild scuffles.',
      language: 'Moderate PG-13 banter and cursing.',
      themes: 'Clever teamwork, loyalty, high-stakes caper.',
      ageAppropriateVerdict: 'A slick, stylish crowd pleaser for teens and adults.'
    },
    aiInsights: {
      headline: 'Unmatched cool factor, snappy banter, and brilliant casino sleight-of-hand.',
      matchScore: 90,
      fitReasons: [
        'George Clooney and Brad Pitt exude effortless charisma',
        'Intricate puzzle plot where all the pieces fall into place',
        'Funk-infused soundtrack and silky-smooth editing'
      ],
      toneScores: { humor: 80, thrill: 82, emotional: 45, pacing: 88 },
      bestFor: 'Relaxed weekend chill session with older teens and friends',
      spoilerFreeVibeCheck: 'Effortlessly cool, suave, clever, and endlessly entertaining.'
    }
  }
];

export const MOODS_CONFIG: {
  mood: import('../types').MoodType;
  label: string;
  emoji: string;
  gradient: string;
  accentColor: string;
  description: string;
}[] = [
  {
    mood: 'Happy',
    label: 'Feel-Good & Uplifting',
    emoji: '✨',
    gradient: 'from-amber-500/30 to-yellow-600/10 border-amber-500/40 text-amber-300',
    accentColor: '#f59e0b',
    description: 'Brimming with laughs, warm smiles, and joyful optimism'
  },
  {
    mood: 'Relaxed',
    label: 'Cozy & Chill',
    emoji: '🍵',
    gradient: 'from-emerald-500/30 to-teal-600/10 border-emerald-500/40 text-emerald-300',
    accentColor: '#10b981',
    description: 'Calm pacing, comforting atmospheres, and zero stress'
  },
  {
    mood: 'Excited',
    label: 'High Energy & Adrenaline',
    emoji: '⚡',
    gradient: 'from-orange-500/30 to-red-600/10 border-orange-500/40 text-orange-300',
    accentColor: '#ff6600',
    description: 'Thrills, fast-paced spectacle, and edge-of-seat excitement'
  },
  {
    mood: 'Curious',
    label: 'Mind-Bending & Intrigued',
    emoji: '🧠',
    gradient: 'from-cyan-500/30 to-blue-600/10 border-cyan-500/40 text-cyan-300',
    accentColor: '#06b6d4',
    description: 'Clever mysteries, cosmic wonders, and puzzle narratives'
  },
  {
    mood: 'Romantic',
    label: 'Heart & Connection',
    emoji: '💖',
    gradient: 'from-pink-500/30 to-rose-600/10 border-pink-500/40 text-pink-300',
    accentColor: '#ec4899',
    description: 'Deep chemistry, poetic journeys, and emotional resonance'
  },
  {
    mood: 'Adventurous',
    label: 'Epic Quests & Discovery',
    emoji: '🧭',
    gradient: 'from-indigo-500/30 to-purple-600/10 border-indigo-500/40 text-indigo-300',
    accentColor: '#8a2be2',
    description: 'Grand worlds, brave heroes, and mythical expeditions'
  }
];

export const GENRES_LIST: import('../types').GenreType[] = [
  'Action',
  'Comedy',
  'Drama',
  'Thriller',
  'Animation',
  'Science Fiction',
  'Family'
];
