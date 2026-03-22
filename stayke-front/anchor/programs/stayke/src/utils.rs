pub struct DateComponents {
    pub year: u32,
    pub month: u32,
    pub day: u32,
    pub year_month: u32, // ej: 202503
}

pub fn derive_date(unix_timestamp: i64) -> DateComponents {
    let days_since_epoch = (unix_timestamp / 86400) as u32;

    // Algoritmo de conversión civil de Howard Hinnant
    let z = days_since_epoch + 719468;
    let era = z / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = if month <= 2 { y + 1 } else { y };

    DateComponents {
        year,
        month,
        day,
        year_month: year * 100 + month,
    }
}
