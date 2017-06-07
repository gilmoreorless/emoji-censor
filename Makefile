iconsrc := src/icon-256.png
iconsizes := {16,32,48,128,256}
icondir := browser-extension/icons
iconfiles := $(shell echo $(icondir)/icon-$(iconsizes).png)

$(icondir)/icon-%.png: $(iconsrc)
	@mkdir -p $(@D)
	convert $(iconsrc) -resize $* $@

icons: $(iconfiles)

clean:
	rm -f $(iconfiles)

.PHONY: icons clean
