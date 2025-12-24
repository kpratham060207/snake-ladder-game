#include<iostream>
#include<time.h>
using namespace std;
int main()
{
	int a,b,user_pos_a=0,user_pos_b=0,flag=0;
    string user_a,user_b;
	srand(time(0));
	//no=rand()%6+1;

    cout<<"\nWelcome To Snake And Ladder Game!!!";
    cout<<"\n\nEnter User 1 Name = ";
    cin>>user_a;
    cout<<"\nEnter User 2 Name = ";
    cin>>user_b;

    while(true)
    {
        cout<<endl<<endl<<user_a<<"'s Chance";
        a=rand()%6+1;
        cin.get();
        cout<<"\nDice Rolled = "<<a;
        user_pos_a+=a;
        if(user_pos_a>100)
            user_pos_a-=a;
        cout<<"\nYour Position = "<<user_pos_a;

        if(user_pos_a==3)
        {
            cout<<"\nYou landed on ladder.";
            user_pos_a=27;
            cout<<"\nYour Position = "<<user_pos_a;
        }
        else if(user_pos_a==8)
        {
            cout<<"\nYou landed on ladder.";
            user_pos_a=30;
            cout<<"\nYour Position = "<<user_pos_a;
        }
        else if(user_pos_a==28)
        {
            cout<<"\nYou landed on ladder.";
            user_pos_a=84;
            cout<<"\nYour Position = "<<user_pos_a;
        }
        else if(user_pos_a==51)
        {
            cout<<"\nYou landed on ladder.";
            user_pos_a=67;
            cout<<"\nYour Position = "<<user_pos_a;
        }
        else if(user_pos_a==71)
        {
            cout<<"\nYou landed on ladder.";
            user_pos_a=99;
            cout<<"\nYour Position = "<<user_pos_a;
        }
        else if(user_pos_a==80)
        {
            cout<<"\nYou landed on ladder.";
            user_pos_a=99;
            cout<<"\nYour Position = "<<user_pos_a;
        }
        else if(user_pos_a==32)
        {
            cout<<"\nYou landed on snake.";
            user_pos_a=10;
            cout<<"\nYour Position = "<<user_pos_a;
        }
        else if(user_pos_a==36)
        {
            cout<<"\nYou landed on snake.";
            user_pos_a=6;
            cout<<"\nYour Position = "<<user_pos_a;
        }
        else if(user_pos_a==48)
        {
            cout<<"\nYou landed on snake.";
            user_pos_a=26;
            cout<<"\nYour Position = "<<user_pos_a;
        }
        else if(user_pos_a==88)
        {
            cout<<"\nYou landed on snake.";
            user_pos_a=24;
            cout<<"\nYour Position = "<<user_pos_a;
        }
        else if(user_pos_a==95)
        {
            cout<<"\nYou landed on snake.";
            user_pos_a=56;
            cout<<"\nYour Position = "<<user_pos_a;
        }

        if(user_pos_a==100)
        {
            cout<<endl<<user_a<<" Wins!!!";
            break;
        }

        cout<<endl<<endl<<user_b<<"'s Chance";
        b=rand()%6+1;
        cin.get();
        cout<<"\nDice Rolled = "<<b;
        user_pos_b+=b;
        if(user_pos_b>100)
            user_pos_b-=b;
        cout<<"\nYour Position = "<<user_pos_b;

        if(user_pos_b==3)
        {
            cout<<"\nYou landed on ladder.";
            user_pos_b=27;
            cout<<"\nYour Position = "<<user_pos_b;
        }
        else if(user_pos_b==8)
        {
            cout<<"\nYou landed on ladder.";
            user_pos_b=30;
            cout<<"\nYour Position = "<<user_pos_b;
        }
        else if(user_pos_b==28)
        {
            cout<<"\nYou landed on ladder.";
            user_pos_b=84;
            cout<<"\nYour Position = "<<user_pos_b;
        }
        else if(user_pos_b==51)
        {
            cout<<"\nYou landed on ladder.";
            user_pos_b=67;
            cout<<"\nYour Position = "<<user_pos_b;
        }
        else if(user_pos_b==71)
        {
            cout<<"\nYou landed on ladder.";
            user_pos_b=99;
            cout<<"\nYour Position = "<<user_pos_b;
        }
        else if(user_pos_b==80)
        {
            cout<<"\nYou landed on ladder.";
            user_pos_b=99;
            cout<<"\nYour Position = "<<user_pos_b;
        }
        else if(user_pos_b==32)
        {
            cout<<"\nYou landed on snake.";
            user_pos_b=10;
            cout<<"\nYour Position = "<<user_pos_b;
        }
        else if(user_pos_b==36)
        {
            cout<<"\nYou landed on snake.";
            user_pos_b=6;
            cout<<"\nYour Position = "<<user_pos_b;
        }
        else if(user_pos_b==48)
        {
            cout<<"\nYou landed on snake.";
            user_pos_b=26;
            cout<<"\nYour Position = "<<user_pos_b;
        }
        else if(user_pos_b==88)
        {
            cout<<"\nYou landed on snake.";
            user_pos_b=24;
            cout<<"\nYour Position = "<<user_pos_b;
        }
        else if(user_pos_b==95)
        {
            cout<<"\nYou landed on snake.";
            user_pos_b=56;
            cout<<"\nYour Position = "<<user_pos_b;
        }

        if(user_pos_b==100)
        {
            cout<<endl<<user_b<<" Wins!!!";
            break;
        }
    }
}