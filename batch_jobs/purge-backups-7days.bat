forfiles /P "C:\FTP\Database Backups"  /D -7 /C "CMD /C if @ISDIR==TRUE echo RD /Q @FILE &RD /Q /S @FILE"