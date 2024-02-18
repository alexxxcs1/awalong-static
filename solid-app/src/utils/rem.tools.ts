export const px2rem = (template: TemplateStringsArray): string => {
    const [ value ] = template
    if(isNaN(Number(value))) return value;
    const value_num = Number(value);
    const base_font_size_str = window.getComputedStyle(document.querySelector('html')!).getPropertyValue('font-size');
    const [font_size_number] = base_font_size_str.match(/\d+/g) || [];
    if(isNaN(Number(font_size_number))) return value;
    const base_value = Number(font_size_number);
    const rem_string = `${value_num / base_value!}rem`
    return rem_string;
}