extdir = browser-extension
extjs = $(extdir)/emoji-censor.js
extzip-chrome = chrome-extension.zip

iconsrc := src/icon-256.png
iconsizes := {16,32,48,128,256}
icondir := $(extdir)/icons
iconfiles := $(shell echo $(icondir)/icon-$(iconsizes).png)

$(icondir)/icon-%.png: $(iconsrc)
	@mkdir -p $(@D)
	convert $(iconsrc) -resize $* $@

extension-metadata/chrome-webstore/icon-128.png: $(iconsrc)
	convert $(iconsrc) -resize 106 -bordercolor transparent -border 11 $@

$(extjs): src/emoji-censor.js
	cp src/emoji-censor.js $@

$(extzip-chrome): $(iconfiles) $(extjs)
	cp LICENSE $(extdir)
	zip -r $(extzip-chrome) $(extdir) -x \*\/.DS_Store -x \*\/TODO.\*
	rm -f $(extdir)/LICENSE


icons: $(iconfiles) extension-metadata/chrome-webstore/icon-128.png

extjs: $(extjs)

zip: $(extzip-chrome)

clean:
	rm -f $(iconfiles)
	rm -f $(extjs)
	rm -f *-extension.zip

.PHONY: icons extjs zip clean
