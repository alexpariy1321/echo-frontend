export const MANAGER_NAMES = {
  "Volkov_Ivan": "Волков Иван",
  "Akimova_Ekaterina": "Акимова Екатерина",
  "Popov_Denis": "Попов Денис",
  "Ahmedshin_Dmitry": "Ахмедшин Дмитрий",
  "Garyaev_Maxim": "Гаряев Максим", // Ты написал "Гаряев Денис", но в коде Maxim. Уточни, если Максим.
  "Ivanova_Elena": "Иванова Елена" 
};

export const COMPANY_NAMES = {
  "UN": "Уральская Нерудная",
  "SO": "Стандарт Ойл"
};

export const getRusName = (id) => MANAGER_NAMES[id] || id.replace(/_/g, " ");
