import type { ReactElement } from "react";

type Size = "thumbnail" | "full";

// Catalogue thumbnails load lazily on their own white mat; the full picture
// sits on the mat its figure provides.
const CLASSES: Readonly<Record<Size, string>> = {
  thumbnail: "mt-4 max-h-56 w-auto rounded-md border border-line bg-white p-2",
  full: "mx-auto max-h-[22rem] w-auto object-contain",
};

/**
 * The picture of a picture question, described by the question it belongs to.
 * @param props - Picture path, German question text and display size.
 * @returns The image.
 */
function QuestionPicture(
  props: Readonly<{ image: string; question: string; size: Size }>,
): ReactElement {
  const { image, question, size } = props;
  return (
    <img
      src={`${import.meta.env.BASE_URL}${image}`}
      alt={`Abbildung zu ${question}`}
      loading={size === "thumbnail" ? "lazy" : "eager"}
      decoding="async"
      className={CLASSES[size]}
    />
  );
}

export { QuestionPicture };
