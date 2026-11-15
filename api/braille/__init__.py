# FR-DOC-03: Ethiopic grade 1 from the liblouis table, English uncontracted.
# The table api/braille/ethio-g1.ctb is LGPL-2.1, copyright Dr. Tamru E. Belay and Mesar Hameed.
from pathlib import Path

_BRF = " A1B'K2L@CIF/MSP\"E3H9O6R^DJG>NTQ,*5<-U8V.%[$+X!&;:4\\0Z7(_?W]#Y)="
_ASCII = {
    "a": "1", "b": "12", "c": "14", "d": "145", "e": "15", "f": "124", "g": "1245",
    "h": "125", "i": "24", "j": "245", "k": "13", "l": "123", "m": "134", "n": "1345",
    "o": "135", "p": "1234", "q": "12345", "r": "1235", "s": "234", "t": "2345",
    "u": "136", "v": "1236", "w": "2456", "x": "1346", "y": "13456", "z": "1356",
    ".": "256", ",": "2", ";": "23", ":": "25", "!": "235", "?": "236", "'": "3", "-": "36",
}
_DIGITS = "jabcdefghi"


def _cell(token):
    bits = 0
    for ch in token:
        if ch in "12345678":
            bits |= 1 << (int(ch) - 1)
    return _BRF[bits]


def _cells(pattern):
    return "".join(_cell(part) for part in pattern.split("-") if part)


def _table():
    found = {}
    path = Path(__file__).with_name("ethio-g1.ctb")
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.split("#", 1)[0].strip()
        if not (line.startswith("letter ") or line.startswith("punctuation ")):
            continue
        parts = line.split()
        if len(parts) < 3 or not parts[1].startswith("\\x"):
            continue
        found[chr(int(parts[1][2:], 16))] = _cells(parts[2])
    return found


_ETHIO = _table()


def to_brf(text, width=40):
    out = []
    line = ""
    number = False

    def put(cells):
        nonlocal line
        for cell in cells:
            if len(line) >= width:
                out.append(line)
                line = ""
            line += cell

    for ch in text:
        if ch == "\n":
            out.append(line)
            line = ""
            number = False
            continue
        if ch == " ":
            put(" ")
            number = False
            continue
        if ch.isdigit():
            if not number:
                put(_cell("3456"))
                number = True
            put(_cell(_DIGITS[int(ch)]))
            continue
        number = False
        if ch in _ETHIO:
            put(_ETHIO[ch])
        elif ch.lower() in _ASCII:
            put(_cell(_ASCII[ch.lower()]))
    if line:
        out.append(line)
    return "\n".join(out) + "\n"
