library(hexSticker)
library(magick)
library(showtext)

google_font_name <- "Rubik"
font_add_google(google_font_name)

showtext_auto()

img <- image_read("hextools/data.svg", density = 192)

logo_file <- "docs/images/logo.png"

logo <- sticker(
    img,
    package = "einbuergerungstest",
    p_color = "#201d18",
    p_family = google_font_name,
    p_size = 24,
    p_x = 1,
    p_y = 1.42,
    s_x = 1,
    s_y = 0.83,
    s_width = 1.3,
    s_height = 0.9,
    h_color = "#14584d",
    filename = logo_file,
    h_fill = "white",
    dpi = 600
)

# sticker() left-aligns the URL from u_x/u_y, so a short URL ends up bunched
# towards the bottom vertex. Draw it centred on the lower-right edge instead,
# inset from the border by the same distance as hexSticker's default.
edge_angle <- pi / 6
inset <- 0.08 * cos(edge_angle)
logo <- logo +
    geom_url(
        "indrapatil.com/einbuergerungstest",
        x = 1 + sqrt(3) / 4 - inset * sin(edge_angle),
        y = 0.25 + inset * cos(edge_angle),
        size = 8,
        color = "grey",
        hjust = 0.5
    )
save_sticker(logo_file, logo, dpi = 600)
