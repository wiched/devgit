import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import ajaxHeart from './modules/heart';


autocomplete($('#address'), $('#lat'), $('#lng'));

typeAhead($('.search'));

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);

// window.addEventListener('load', () => {
//   window.cookieconsent.initialise({
//     palette: {
//       popup: {
//         background: '#000'
//       },
//       button: {
//         background: '#f1d600'
//       }
//     },
//     content: {
//       message: 'Използвайки DevZone.bg, Вие се съгласявате с <a href="/cookie-policy" style="color: darkgrey">"Политика за използване на "Бисквитки""</a>, необходими за пълната функционалност на сайта."',
//       dismiss: 'Съгласен съм ✔️',
//       link: '',
//       href: ''
//     }
//   });
// });
