import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter/gestures.dart';
import 'config/routes.dart';
import 'providers/auth_provider.dart';
import 'providers/acara_provider.dart';
import 'providers/latihan_provider.dart';
import 'providers/notification_provider.dart';
import 'theme/app_theme.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/main_screen.dart';
import 'screens/acara/acara_detail_screen.dart';
import 'screens/acara/acara_register_screen.dart';
import 'screens/latihan/latihan_detail_screen.dart';
import 'screens/absensi/scan_qr_screen.dart';
import 'screens/absensi/absensi_history_screen.dart';
import 'screens/partitur/partitur_view_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/profile/edit_profile_screen.dart';
import 'screens/notification/notification_screen.dart';
import 'utils/notification_helper.dart';
import 'package:intl/date_symbol_data_local.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationHelper.init();
  await initializeDateFormatting('id', null);

  // Lock to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Status bar style
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));

  runApp(const PCUChoirApp());
}

class PCUChoirApp extends StatelessWidget {
  const PCUChoirApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AcaraProvider()),
        ChangeNotifierProvider(create: (_) => LatihanProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: MaterialApp(
        title: 'PCU Choir',
        scrollBehavior: DesktopScrollBehavior(),
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        initialRoute: AppRoutes.splash,
        onGenerateRoute: (settings) {
          switch (settings.name) {
            case AppRoutes.splash:
              return _fadeRoute(const SplashScreen(), settings);
            case AppRoutes.login:
              return _slideRoute(const LoginScreen(), settings);
            case AppRoutes.main:
              return _fadeRoute(const MainScreen(), settings);
            case AppRoutes.eventDetail:
              return _slideRoute(
                AcaraDetailScreen(acara: settings.arguments as dynamic),
                settings,
              );
            case AppRoutes.eventRegister:
              return _slideRoute(
                AcaraRegisterScreen(acara: settings.arguments as dynamic),
                settings,
              );
            case AppRoutes.latihanDetail:
              return _slideRoute(
                LatihanDetailScreen(latihan: settings.arguments as dynamic),
                settings,
              );
            case AppRoutes.scanQr:
              return _slideRoute(const ScanQrScreen(), settings);
            case AppRoutes.absensiHistory:
              return _slideRoute(const AbsensiHistoryScreen(), settings);
            case AppRoutes.partiturView:
              return _slideRoute(
                PartiturViewScreen(partitur: settings.arguments as dynamic),
                settings,
              );
            case AppRoutes.profile:
              return _slideRoute(const ProfileScreen(), settings);
            case AppRoutes.editProfile:
              return _slideRoute(const EditProfileScreen(), settings);
            case AppRoutes.notifications:
              return _slideRoute(const NotificationScreen(), settings);
            default:
              return _fadeRoute(const SplashScreen(), settings);
          }
        },
      ),
    );
  }

  static PageRoute _fadeRoute(Widget page, RouteSettings settings) {
    return PageRouteBuilder(
      settings: settings,
      pageBuilder: (_, __, ___) => page,
      transitionDuration: const Duration(milliseconds: 300),
      transitionsBuilder: (_, animation, __, child) =>
          FadeTransition(opacity: animation, child: child),
    );
  }

  static PageRoute _slideRoute(Widget page, RouteSettings settings) {
    return PageRouteBuilder(
      settings: settings,
      pageBuilder: (_, __, ___) => page,
      transitionDuration: const Duration(milliseconds: 280),
      transitionsBuilder: (_, animation, __, child) {
        final tween = Tween(
          begin: const Offset(1.0, 0.0),
          end: Offset.zero,
        ).chain(CurveTween(curve: Curves.easeOutCubic));
        return SlideTransition(position: animation.drive(tween), child: child);
      },
    );
  }
}

class DesktopScrollBehavior extends MaterialScrollBehavior {
  @override
  Set<PointerDeviceKind> get dragDevices => {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse,
        PointerDeviceKind.trackpad,
      };
}
