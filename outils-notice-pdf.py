# -*- coding: utf-8 -*-
"""Notice Nakree, en PDF telechargeable.

Le contenu est celui de /pages/notice, mot pour mot : deux sources qui
divergent, c'est une reclamation qui arrive un jour. Dix minutes partout,
marche/arret a gauche et chaleur a droite, comme sur l'appareil recu.

Compose en Segoe UI faute de Geist : reportlab ne lit pas les OpenType
CFF, et Inter n'est installe ici qu'en .otf. Segoe est une grotesque
neutre, la parente suffit pour un document imprimable.
"""
import os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

sys.stdout.reconfigure(encoding="utf-8")

POLICES = "C:/Windows/Fonts/"
pdfmetrics.registerFont(TTFont("N",  POLICES + "segoeui.ttf"))
pdfmetrics.registerFont(TTFont("NB", POLICES + "seguisb.ttf"))
pdfmetrics.registerFont(TTFont("NG", POLICES + "segoeuib.ttf"))

VERT   = HexColor("#047857")
ENCRE  = HexColor("#17171A")
ENCRE2 = HexColor("#56565E")
ENCRE3 = HexColor("#9A9AA4")
VOILE  = HexColor("#EDF3F0")
TRAIT  = HexColor("#E4E4E8")

L, H = A4
MG   = 20 * mm
HAUT = H - 22 * mm
BAS  = 24 * mm
LARG = L - 2 * MG

SORTIE = "assets/nakree-notice.pdf"


class Doc:
    def __init__(self):
        self.c = canvas.Canvas(SORTIE, pagesize=A4)
        self.c.setTitle("Nakree \u2014 Notice d'utilisation")
        self.c.setAuthor("Nakree")
        self.c.setSubject("Masseur nuque et \u00e9paules sans fil")
        self.page = 0
        self.nouvelle_page(premiere=True)

    def nouvelle_page(self, premiere=False):
        if not premiere:
            self.pied()
            self.c.showPage()
        self.page += 1
        self.y = HAUT
        if premiere:
            self.entete_titre()
        else:
            self.entete_courant()

    def place(self, besoin):
        """Tourne la page si le bloc qui vient ne tient plus dessous."""
        if self.y - besoin < BAS:
            self.nouvelle_page()

    def entete_titre(self):
        c = self.c
        c.setFillColor(VOILE)
        c.rect(0, H - 52 * mm, L, 52 * mm, stroke=0, fill=1)

        c.setFont("NB", 17)
        c.setFillColor(ENCRE)
        c.drawString(MG, H - 22 * mm, "nakree")
        larg = c.stringWidth("nakree", "NB", 17)
        c.setFillColor(VERT)
        c.drawString(MG + larg, H - 22 * mm, ".")

        c.setFont("NG", 26)
        c.setFillColor(ENCRE)
        c.drawString(MG, H - 35 * mm, "Notice d'utilisation")
        c.setFont("N", 11.5)
        c.setFillColor(ENCRE2)
        c.drawString(MG, H - 43 * mm, "Masseur nuque et \u00e9paules sans fil, chauffant")

        self.y = H - 64 * mm

    def entete_courant(self):
        c = self.c
        c.setFont("NB", 9)
        c.setFillColor(ENCRE3)
        c.drawString(MG, H - 15 * mm, "NAKREE \u2014 NOTICE D'UTILISATION")
        c.setStrokeColor(TRAIT)
        c.setLineWidth(0.6)
        c.line(MG, H - 18 * mm, L - MG, H - 18 * mm)
        self.y = H - 28 * mm

    def pied(self):
        c = self.c
        c.setStrokeColor(TRAIT)
        c.setLineWidth(0.6)
        c.line(MG, 17 * mm, L - MG, 17 * mm)
        c.setFont("N", 8.5)
        c.setFillColor(ENCRE3)
        c.drawString(MG, 12 * mm, "support@nakree.com  \u00b7  nakree.com/pages/suivi")
        c.drawRightString(L - MG, 12 * mm, "Page %d" % self.page)

    def titre(self, txt):
        self.place(22 * mm)
        self.y -= 4 * mm
        self.c.setFont("NG", 13.5)
        self.c.setFillColor(ENCRE)
        self.c.drawString(MG, self.y, txt)
        self.y -= 3 * mm
        self.c.setStrokeColor(VERT)
        self.c.setLineWidth(1.6)
        self.c.line(MG, self.y, MG + 14 * mm, self.y)
        self.y -= 6.5 * mm

    def _decoupe(self, txt, taille, larg_max):
        lignes, ligne = [], ""
        for mot in txt.split():
            essai = (ligne + " " + mot).strip()
            if pdfmetrics.stringWidth(essai, "N", taille) > larg_max and ligne:
                lignes.append(ligne)
                ligne = mot
            else:
                ligne = essai
        if ligne:
            lignes.append(ligne)
        return lignes

    def para(self, txt, indent=0, taille=10.5):
        lignes = self._decoupe(txt, taille, LARG - indent)
        self.place(len(lignes) * 5.4 * mm + 3 * mm)
        self.c.setFont("N", taille)
        self.c.setFillColor(ENCRE2)
        for l in lignes:
            self.c.drawString(MG + indent, self.y, l)
            self.y -= 5.4 * mm
        self.y -= 2 * mm

    def puce(self, txt, gras=None):
        """Une puce, avec un debut en gras optionnel sur la premiere ligne."""
        indent = 6.5 * mm
        taille = 10.5
        entier = (gras + " \u2014 " + txt) if gras else txt
        lignes = self._decoupe(entier, taille, LARG - indent)

        self.place(len(lignes) * 5.4 * mm + 4 * mm)
        self.c.setFillColor(VERT)
        self.c.circle(MG + 1.6 * mm, self.y + 1.3 * mm, 1.05 * mm, stroke=0, fill=1)

        for i, l in enumerate(lignes):
            x = MG + indent
            if i == 0 and gras:
                debut = gras + " \u2014"
                self.c.setFont("NB", taille)
                self.c.setFillColor(ENCRE)
                self.c.drawString(x, self.y, debut)
                x += pdfmetrics.stringWidth(debut, "NB", taille)
                reste = l[len(debut):]
                self.c.setFont("N", taille)
                self.c.setFillColor(ENCRE2)
                self.c.drawString(x, self.y, reste)
            else:
                self.c.setFont("N", taille)
                self.c.setFillColor(ENCRE2)
                self.c.drawString(x, self.y, l)
            self.y -= 5.4 * mm
        self.y -= 1.5 * mm

    def encadre(self, lignes_txt, titre=None):
        haut = 9 * mm + len(lignes_txt) * 5.4 * mm + (7 * mm if titre else 0)
        self.place(haut + 5 * mm)
        y0 = self.y + 4 * mm
        self.c.setFillColor(VOILE)
        self.c.roundRect(MG, y0 - haut, LARG, haut, 3 * mm, stroke=0, fill=1)
        self.y = y0 - 9 * mm
        if titre:
            self.c.setFont("NB", 10.5)
            self.c.setFillColor(ENCRE)
            self.c.drawString(MG + 6 * mm, self.y, titre)
            self.y -= 6.5 * mm
        self.c.setFont("N", 10)
        self.c.setFillColor(ENCRE2)
        for l in lignes_txt:
            self.c.drawString(MG + 6 * mm, self.y, l)
            self.y -= 5.4 * mm
        self.y -= 4 * mm

    def tableau(self, paires):
        self.place(len(paires) * 7 * mm + 4 * mm)
        for i, (gauche, droite) in enumerate(paires):
            if i:
                self.c.setStrokeColor(TRAIT)
                self.c.setLineWidth(0.5)
                self.c.line(MG, self.y + 4.6 * mm, L - MG, self.y + 4.6 * mm)
            self.c.setFont("N", 10.5)
            self.c.setFillColor(ENCRE2)
            self.c.drawString(MG, self.y, gauche)
            self.c.setFont("NB", 10.5)
            self.c.setFillColor(ENCRE)
            self.c.drawRightString(L - MG, self.y, droite)
            self.y -= 7 * mm
        self.y -= 2 * mm

    def finir(self):
        self.pied()
        self.c.save()


d = Doc()

d.para("Cette notice reprend celle qui est livr\u00e9e dans la bo\u00eete. Gardez-la sous la main : "
       "elle r\u00e9pond \u00e0 la plupart des questions qui arrivent au service client.")

d.titre("Dans la bo\u00eete")
for x in ["Le masseur nuque et \u00e9paules",
          "Sa sangle r\u00e9glable, avec boucle \u00e0 clip",
          "Son c\u00e2ble de charge USB-C",
          "Cette notice"]:
    d.puce(x)

d.titre("Le mettre en place")
d.para("Posez l'appareil sur les \u00e9paules, les deux mains en silicone de part et d'autre de la "
       "nuque. Tirez la boucle vers l'arri\u00e8re, puis ins\u00e9rez-la jusqu'au clic.")
d.para("R\u00e9glez les deux sangles \u00e0 la m\u00eame longueur : c'est ce qui r\u00e9partit la pression. Une "
       "sangle plus courte que l'autre fait porter tout l'appareil d'un seul c\u00f4t\u00e9, et serre.")

d.titre("Les commandes")
d.para("Le panneau se trouve sur le dessus. \u00c0 gauche, le bouton marche/arr\u00eat et modes. "
       "\u00c0 droite, le bouton chaleur. Entre les deux, le port USB-C, et le t\u00e9moin lumineux "
       "juste en dessous.")
d.puce("appui long de trois secondes sur le bouton de gauche. \u00c0 l'allumage : t\u00e9moin blanc, "
       "mode de massage 1, chaleur au niveau bas.", gras="Allumer, \u00e9teindre")
d.puce("appui bref sur ce m\u00eame bouton. Trois modes se succ\u00e8dent ; le t\u00e9moin blanc clignote "
       "une, deux ou trois fois selon le mode.", gras="Changer de mode")
d.puce("bouton de droite : niveau bas, niveau \u00e9lev\u00e9, puis arr\u00eat. Le t\u00e9moin passe au rouge "
       "et clignote une ou deux fois.", gras="Chaleur")
d.encadre(["Changer de mode de massage ne modifie jamais la chaleur, et inversement.",
           "Vous pouvez donc utiliser la chaleur seule, le massage seul, ou les deux."],
          titre="Les deux r\u00e9glages sont ind\u00e9pendants")

d.titre("Arr\u00eat automatique")
d.para("L'appareil s'\u00e9teint seul au bout de dix minutes. C'est voulu : une s\u00e9ance se compte "
       "en minutes, pas en heures. Pour une seconde s\u00e9ance, rallumez-le.")

d.titre("Charge")
d.para("Branchez le c\u00e2ble USB-C sur n'importe quel chargeur de t\u00e9l\u00e9phone. Le t\u00e9moin vous dit "
       "o\u00f9 en est la batterie :")
d.puce("batterie faible, il est temps de recharger.", gras="Rouge clignotant")
d.puce("charge en cours.", gras="Rouge fixe")
d.puce("charge termin\u00e9e.", gras="Blanc fixe")
d.para("Le fabricant annonce jusqu'\u00e0 douze jours d'autonomie, \u00e0 raison de dix minutes "
       "d'utilisation par jour.")

d.titre("Entretien")
d.para("Essuyez le tissu et les t\u00eates en silicone avec un chiffon doux l\u00e9g\u00e8rement humide, puis "
       "laissez s\u00e9cher \u00e0 l'air libre. Ne passez pas l'appareil sous l'eau, ne le mettez ni en "
       "machine ni au s\u00e8che-cheveux. Rangez-le \u00e0 l'abri de l'humidit\u00e9.")

d.titre("Pr\u00e9cautions")
for x in ["Ne pas utiliser sur une peau l\u00e9s\u00e9e, irrit\u00e9e, ou apr\u00e8s une intervention r\u00e9cente.",
          "Ne pas utiliser en conduisant, ni en s'endormant.",
          "Ne pas d\u00e9passer dix minutes d'affil\u00e9e.",
          "Tenir hors de port\u00e9e des enfants.",
          "Ne pas utiliser pendant la charge."]:
    d.puce(x)
d.para("En cas de stimulateur cardiaque, d'implant, de grossesse, de trouble circulatoire, ou "
       "de simple doute : demandez l'avis d'un professionnel de sant\u00e9 avant utilisation.")
d.para("Si l'appareil chauffe anormalement, fait un bruit inhabituel, ou si le bo\u00eetier est "
       "endommag\u00e9, arr\u00eatez-vous et \u00e9crivez-nous \u00e0 support@nakree.com.")

d.titre("Caract\u00e9ristiques")
d.tableau([("Modes de massage", "3"),
           ("Niveaux de chaleur", "2 + arr\u00eat"),
           ("Arr\u00eat automatique", "10 minutes"),
           ("Masse", "0,76 kg"),
           ("Charge", "USB-C"),
           ("Autonomie annonc\u00e9e", "jusqu'\u00e0 12 jours, \u00e0 10 min par jour")])

d.titre("Ce que cet appareil n'est pas")
d.para("Nakree est un appareil de bien-\u00eatre. Ce n'est pas un dispositif m\u00e9dical : il ne "
       "diagnostique rien, ne traite rien, et ne remplace pas l'avis d'un professionnel de "
       "sant\u00e9.")

d.titre("Conformit\u00e9 et fin de vie")
d.para("Appareil conforme CE. Il contient une batterie lithium-ion : ne le jetez pas avec les "
       "ordures m\u00e9nag\u00e8res. D\u00e9posez-le en d\u00e9ch\u00e8terie ou dans un point de collecte DEEE, "
       "batterie comprise.")

# Ni adresse postale ni SIREN dans ce document : il circule, il s'imprime,
# il se transfere. L'identification legale a sa place dans les mentions
# legales du site, pas dans une notice d'utilisation.
d.encadre(["\u00c9crivez \u00e0 support@nakree.com, du lundi au vendredi.",
           "R\u00e9ponse sous 24 \u00e0 48 heures ouvr\u00e9es.",
           "Pour suivre un colis : nakree.com/pages/suivi"],
          titre="Une question ?")

d.finir()
print("ecrit :", SORTIE, os.path.getsize(SORTIE), "octets,", d.page, "pages")
