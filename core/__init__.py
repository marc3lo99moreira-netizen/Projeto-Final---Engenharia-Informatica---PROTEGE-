import pymysql

# Forçamos o PyMySQL a fingir que é uma versão moderna do mysqlclient
pymysql.version_info = (2, 2, 1, "final", 0)
pymysql.install_as_MySQLdb()