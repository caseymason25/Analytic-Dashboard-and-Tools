CD C:\FTP\xampp\mysql\bin
mysql -u _redacted_ -pconnect _redacted_ -e "DELETE FROM timer_stats WHERE update_dt_tm <= CURDATE() - INTERVAL 7 DAY;"
exit