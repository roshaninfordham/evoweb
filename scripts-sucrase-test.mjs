import { transform } from "sucrase";
const sample = `function Component(props) {
  return <SlotPanel><SlotLabel>hi</SlotLabel></SlotPanel>;
}`;
const { code } = transform(sample, { transforms: ["jsx", "typescript"] });
console.log(code);
