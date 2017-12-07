const handlebars = require('handlebars');
const AbstractRouter = require('ticelli-bot');
const get = require('lodash.get');

module.exports = class AnswerPicker extends AbstractRouter {
  constructor(translations, ...configs) {
    super(...configs);
    this.translations = translations;
  }

  run(train) {
    train
      .hang({ answerPicker: this })
      .hang({
        translate: this.pick.bind(this, train.locale || this.config.defaultLocale || 'en'),
      })
    ;
    return super.run(train);
  }

  pick(locale, ...params) {
    const templateId = params.shift();
    let vars = {};
    if (params.length === 1) {
      [vars] = params;
    } else if (params.length > 1) {
      vars = Object.assign(...params);
    }
    try {
      let translations = []
        .concat(this.translations[locale][templateId])
        .map(t => {
          if (typeof t === 'string') {
            t = {
              required: [],
              template: t,
            };
          }

          t.weight = 0;

          for (const r of t.required) {
            if (!get(vars, r)) {
              return false;
            } else {
              t.weight = 1;
            }
          }

          return t;
        })
        .filter(t => !!t);
      const maxWeight = translations.reduce((max, t) => t.weight > max ? t.weight : max, 0);
      translations = translations.filter(t => t.weight === maxWeight);
      const index = Math.floor(Math.random() * translations.length);
      const translation = translations[index];
      const template = handlebars.compile(translation.template);
      return template(vars);
    } catch (e) {
      return templateId;
    }
  }
};
