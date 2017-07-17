extdir = browser-extension
extjs = $(extdir)/emoji-censor.js
extzip = extension.zip

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

$(extzip): $(iconfiles) $(extjs)
	cp LICENSE $(extdir)
	rm -f $(extzip)
	cd $(extdir) && zip -r ../$(extzip) . -x .DS_Store -x TODO.\*
	rm -f $(extdir)/LICENSE


icons: $(iconfiles) extension-metadata/chrome-webstore/icon-128.png

extjs: $(extjs)

zip: $(extzip)

clean:
	rm -f $(iconfiles) $(extjs) $(extzip)

.PHONY: icons extjs zip clean
