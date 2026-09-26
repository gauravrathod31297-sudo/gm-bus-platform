import 'package:flutter_tts/flutter_tts.dart';
class TtsService {
  static final FlutterTts _tts = FlutterTts();
  static const _locale = {'MR':'mr-IN','GU':'gu-IN','EN':'en-IN','HI':'hi-IN'};
  static Future<void> speak(String lang, String stop) async {
    final text = {
      'MR':'पुढील थांबा $stop येत आहे. कृपया उतरण्यासाठी तयार राहा.',
      'GU':'આગળનું સ્ટોપ $stop આવી રહ્યું છે. કૃપા કરીને બસ ઊતરવા માટે તૈયાર રહો.',
      'EN':'Next stop is $stop. Please prepare to alight.',
      'HI':'अगला स्टॉप $stop आ रहा है। कृपया उतरने के लिए तैयार रहें.',
    }[lang]!;
    await _tts.setLanguage(_locale[lang]!);
    await _tts.speak(text);
  }
}
