'''
    Create a million sample database rows
'''
import json
import sqlalchemy
import random
from psycopg2.extras import Json
from tqdm import tqdm
from . import config
from . import database

engine = database.create_engine()

girls = [
    "SUNNY",
    "PUMPKIN",
    "ARIEL",
    "FRECKLES",
    "COCO",
    "ELSA",
    "DORY",
    "PEACH",
    "BUBBLES",
    "ELLA",
    "ANGEL",
    "HELGA",
    "BUFFY",
    "DEB",
    "JEWEL",
    "MAGNOLIA",
    "DIVA",
    "GRACIE",
    "ANNIE",
    "BABY",
    "FLOWER",
    "COOKIE",
    "LORDES",
    "GOLDIE",
    "HOPE",
    "SHELLY",
    "DAISY",
    "CASSIE",
    "GAIL",
    "AMY",
    "GWEN",
    "BABS",
    "TORI",
    "VENUS",
    "MONA",
    "CLEO",
    "FERN",
    "WAVY",
    "ALLIE",
    "SANDY",
    "CANDY",
    "BUBBLY",
    "ROXY",
    "LAVENDER",
    "TILLY",
    "DELILA",
    "EMILY",
    "BESS",
    "ATHENA",
    "KENDRA",
    "NESSIE",
    "CARMEL",
    "GINGER",
    "FRANNIE",
    "LILY",
    "KAREN",
    "TIGRESS",
    "NINA",
    "CASSIE",
    "URSULA",
    "SAVANAH",
    "HATTIE",
    "FREIDA",
    "CINDY",
    "MRS PUFF",
    "ISABELLA",
    "PENNY",
    "JENNY",
    "MINNIE",
    "ROSY",
    "BILLIE",
    "GISELLE",
    "LUCY",
    "SISSY",
    "WANDA",
    "EDITH",
    "ANGELA",
    "JADE",
    "DEVINE",
    "KIKO",
    "YVETTE",
    "CRYSTAL",
    "FELICITY",
    "FLORENCE",
    "IRENE",
    "QUEENIE",
    "DODY",
    "BARBIE",
    "SOPHIA",
    "ROLLY POLLY",
    "DONNA",
    "POLLY",
    "ZSA ZSA",
    "EVELYN",
    "GRETA",
    "LISA",
    "MILA",
    "VELMA",
    "XENA",
    "WYNNONA",
]

boys = [
    "SUSHI",
    "BUBBLES",
    "CASPER",
    "SHADOW",
    "COMET",
    "FLASH",
    "BLUE",
    "CRIMSON",
    "JOHNSON",
    "NEMO",
    "SPIKE",
    "SPOT",
    "ACE",
    "AJAX",
    "FINLEY",
    "CAPTAIN JACK",
    "DRAKE",
    "MARLIN",
    "BRUCE",
    "CRUSH",
    "BABEL",
    "DEXTER",
    "GILLIGAN",
    "BONES",
    "DUSTY",
    "BLADE",
    "CLINT",
    "ASTRO",
    "N CHIPS",
    "NIGEL",
    "DREW",
    "BUBBA",
    "GORDO",
    "BINGO",
    "GANDALF",
    "EARL",
    "CHARLIE",
    "BUB",
    "SQUIRT",
    "DINGO",
    "CLIFF",
    "DUKE",
    "ERNIE",
    "BROWNIE",
    "FONZIE",
    "COSMO",
    "BENNIE",
    "ARTIE",
    "BUSTER",
    "EINSTEIN",
    "HOUDINI",
    "APOLLO",
    "BARNEY",
    "MACK",
    "KILLER",
    "HONDO",
    "BENJI",
    "CHARLIE",
    "T-BONE",
    "FLOYD",
    "BUDDY",
    "PLANKTON",
    "MELVIN",
    "ARCHIE",
    "HARPO",
    "LARRY",
    "JUGHEAD",
    "FRANKY",
    "BURNS",
    "DENZEL",
    "HAL",
    "KERMIT",
    "GUSTAV",
    "LEONARDO",
    "PATRICK",
    "BUNGEE",
    "HARDY",
    "RIPPER",
    "STEWY",
    "FLICKER",
    "DIXON",
    "MOREY",
    "TUNA",
    "OBIE",
    "BOSCO",
    "TRICKY",
    "JIMBO",
    "GUNTHER",
    "EDMUND",
    "ROLLO",
    "IGOR",
    "CHESTER",
    "FREDDY",
    "BEVIS",
    "DILBERT",
    "GAVIN",
    "SPUTTER",
    "WIGGUMS",
    "FOX",
    "SKIPPY",
]

girls = [f.capitalize() for f in girls]
boys = [f.capitalize() for f in boys]

all_names = girls + boys

species = sorted(
    [
        "Salmon",
        "Goldfish",
        "Tuna",
        "Albacore",
        "Guppy",
        "Clownfish",
        "Tetra",
        "Betta",
        "Carp",
        "Pike",
        "Cod",
        "Minnow",
        "Piranha",
        "Sunfish",
        "Shark",
        "Bass",
    ]
)

colors = sorted(
    [
        "Red",
        "Green",
        "Blue",
        "Orange",
        "Yellow",
        "Black",
        "White",
        "Pink",
        "Purple",
        "Grey",
        "Lime",
        "Teal",
    ]
)

INSERT="""
    INSERT INTO fish(first, last, species, color, gender)
         SELECT 
            e->>'first',
            e->>'last',
            e->>'species',
            e->>'color',
            e->>'gender'
       FROM (
            SELECT jsonb_array_elements(%(data)s) e
       ) a;
"""

def repopulate():
    with engine.connect() as connection:
        connection.execute("delete from fish")
        for i in tqdm(range(25)):
            rows=[]
            for last in all_names:
                for first in girls:
                    rows.append(
                        dict(
                            first=first,
                            last=last,
                            species=random.choice(species),
                            color=random.choice(colors),
                            gender='female')
                        )

                for first in boys:
                    rows.append(
                        dict(
                            first=first,
                            last=last,
                            species=random.choice(species),
                            color=random.choice(colors),
                            gender='male')
                        )
            
            connection.execute(
                INSERT,
                data=Json(rows)
            
            )
            
if __name__=="__main__":
    repopulate()